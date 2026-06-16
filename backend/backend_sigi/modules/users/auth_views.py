from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .models import Users
from .serializers import UserSerializer

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        #por medio del authenticate verifca tiempo < 2h y password correcta
        user = authenticate(request, username=email, password=password)

        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        # Verificar si ya hay sesión activa y no ha expirado. Es lo mismo que preguntarse, existe un token registrado y la hora-actual es < hora-caducada? si si envia error porque ya existe sesion iniciada
        if user.current_token_jti and user.current_token_expires_at:
            if timezone.now() < user.current_token_expires_at:
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
        user.last_login = timezone.now()   #guarda last_login en data base
        user.save()
        #en un json se le entrega a react lod 2 tokens, determina si el usuario no ha cambiado contraseña y user, es la informacion del usuario
        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'must_change_password': user.must_change_password,
            'user': UserSerializer(user).data
        })