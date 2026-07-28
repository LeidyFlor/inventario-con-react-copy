from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from .models import Users
from .serializers import UserSerializer
from .backends import HEARTBEAT_GRACE_PERIOD
import random
import string
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.conf import settings

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        #por medio del authenticate verifca tiempo < 2h y password correcta
        user = authenticate(request, username=email, password=password)

        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        # Verificar si ya hay sesión activa y no ha expirado. Es lo mismo que preguntarse, existe un token registrado y la hora-actual es < hora-caducada? si si envia error porque ya existe sesion iniciada
        #
        # Además del tope de 8h, se revisa el heartbeat: si el usuario cerró la
        # pestaña, nunca vuelve a llegar una petición con el token viejo, así que
        # JWTSessionAuthentication.get_user() nunca tiene la oportunidad de limpiar
        # current_token_jti (solo se limpia cuando ESE token se vuelve a usar).
        # Sin este chequeo, el usuario quedaría bloqueado hasta que se cumplan las
        # 8 horas completas, aunque su sesión ya esté "muerta" hace rato.
        if user.current_token_jti and user.current_token_expires_at:
            session_still_valid = timezone.now() < user.current_token_expires_at
            heartbeat_alive = (
                user.last_heartbeat_at
                and timezone.now() - user.last_heartbeat_at <= HEARTBEAT_GRACE_PERIOD
            )
            if session_still_valid and heartbeat_alive:
                return Response(
                    {'error': 'Ya hay una sesión activa con este usuario'},
                    status=status.HTTP_409_CONFLICT
                )

        # Generar nuevos tokens. Tanto para el token diario(llave "maestra") como para el de 8h (llave "temporal")
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Guardar jti y expiración en el usuario
        user.current_token_jti = str(access['jti'])
        user.current_token_expires_at = timezone.now() + timedelta(hours=8)
        # Arranca el reloj del heartbeat justo en el login, para que la
        # primera petición no encuentre el campo vacío y se dispare el
        # chequeo de inactividad antes de que el frontend envíe su primer latido
        user.last_heartbeat_at = timezone.now()
        user.last_login = timezone.now()   #guarda last_login en data base
        user.save()
        #en un json se le entrega a react lod 2 tokens, determina si el usuario no ha cambiado contraseña y user, es la informacion del usuario
        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'must_change_password': user.must_change_password,
            'user': UserSerializer(user).data
        })


class ForgotPasswordView(APIView):
    # AllowAny porque el usuario no está autenticado cuando recupera su contraseña
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        # Validar que venga el correo
        if not email:
            return Response({'error': 'El correo es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Buscar el usuario por correo en la base de datos
            user = Users.objects.get(email=email)
        except Users.DoesNotExist:
            # Por seguridad respondemos igual aunque el correo no exista
            # Así un atacante no puede saber qué correos están registrados
            return Response({'message': 'Si el correo está registrado recibirás un código'})

        # Generar código numérico de 6 dígitos aleatorio
        code = ''.join(random.choices(string.digits, k=6))

        # Guardar el código en Redis asociado al correo
        # timeout=600 significa que expira en 10 minutos (600 segundos)
        cache.set(f'reset_code_{email}', code, timeout=600)

        html_body = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif; color: #242424; }}
                .container {{ max-width: 500px; background-color: #ffffff; border-radius: 1rem; border: 2px solid #E1F2D8; margin: 20px auto; overflow: hidden; }}
                .header {{ background: linear-gradient(to right, #72277C, #163F5C); padding: 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 1px; }}
                .content {{ padding: 32px 24px; text-align: center; }}
                .token-box {{ background-color: #F5FAF2; border: 2px dashed #39A900; border-radius: 0.75rem; padding: 20px; margin: 24px auto; max-width: 300px; }}
                .token-label {{ font-size: 0.875rem; color: #007A33; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; display: block; }}
                .token-code {{ font-size: 2.5rem; font-weight: 700; color: #007A33; letter-spacing: 6px; margin: 0; }}
                .footer {{ padding: 24px; text-align: center; border-top: 1px solid #D1D1D1; background-color: #fafafa; }}
                .footer p {{ margin: 0; font-size: 0.75rem; color: #878787; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>SIGI</h1></div>
                <div class="content">
                    <h2 style="margin-top:0; color:#007A33;">Recuperación de contraseña</h2>
                    <p>Hola {user.first_name}, hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Ingresa el siguiente código de seguridad:</p>
                    <div class="token-box">
                        <span class="token-label">Tu código de seguridad</span>
                        <p class="token-code">{code}</p>
                    </div>
                    <p style="font-size:0.875rem; color:#878787;">Este código expira en 10 minutos.</p>
                </div>
                <div class="footer">
                    <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje. Tu cuenta está protegida.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Enviar correo via Django SMTP (Brevo)
        send_mail(
            subject="Código de recuperación - SIGI",
            message=strip_tags(html_body),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_body,
            fail_silently=False,
        )

        # Respondemos igual en ambos casos (correo existe o no) por seguridad
        return Response({'message': 'Si el correo está registrado recibirás un código'})


class VerifyResetCodeView(APIView):
    # AllowAny porque el usuario no está autenticado en este paso
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        # Validar que vengan ambos campos
        if not email or not code:
            return Response({'error': 'Correo y código son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar el código guardado en Redis para ese correo
        saved_code = cache.get(f'reset_code_{email}')

        # Si no existe en Redis (expiró o nunca se generó) o no coincide, rechazar
        if not saved_code or saved_code != code:
            return Response({'error': 'Código inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

        # El código es válido — el frontend puede avanzar al paso de nueva contraseña
        return Response({'message': 'Código válido'})


class ResetPasswordView(APIView):
    # AllowAny porque el usuario no está autenticado en este paso
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('password')

        # Validar que vengan todos los campos necesarios
        if not all([email, code, new_password]):
            return Response({'error': 'Todos los campos son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar el código de nuevo por seguridad
        # (el usuario pudo haber manipulado el flujo saltándose el paso de verificación)
        saved_code = cache.get(f'reset_code_{email}')
        if not saved_code or saved_code != code:
            return Response({'error': 'Código inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Users.objects.get(email=email)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # set_password hace el hash de la contraseña automáticamente (nunca se guarda en texto plano)
        user.set_password(new_password)
        # Marcar que ya no necesita cambiar contraseña
        user.must_change_password = False
        user.save()

        # Eliminar el código de Redis para que no se pueda reutilizar
        cache.delete(f'reset_code_{email}')

        return Response({'message': 'Contraseña actualizada correctamente'})