from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.auth.models import Group, Permission
from .models import Users, GroupProfile
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer, ChangePasswordSerializer, GroupSerializer
from .constants import esta_dentro_de_vigencia
from django.conf import settings
from supabase import create_client
from django.utils import timezone
from datetime import timedelta
import random
import requests as http_requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.utils.html import strip_tags
from backend_sigi.utils.audit import log_action
from backend_sigi.utils.perm_check import deny_if_no_perm

class UserViewSet(viewsets.ViewSet):
    """
    ViewSet de usuarios:
      GET    /api/users/        - listar todos
      POST   /api/users/        - crear usuario
      GET    /api/users/{id}/   - ver detalle
      PUT    /api/users/{id}/   - editar usuario
      DELETE /api/users/{id}/   - desactivar usuario (soft delete)
    """

    def list(self, request):
        """GET /api/users/ — listar usuarios"""
        deny = deny_if_no_perm(request, 'users.listar_usuarios')
        if deny: return deny
        users = Users.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/users/ — crear nuevo usuario"""
        deny = deny_if_no_perm(request, 'users.add_users')
        if deny: return deny
        serializer = UserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Enviar correo con la contraseña temporal generada
        plain_password = getattr(user, '_plain_password', None)
        if plain_password:
            try:
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
                        .content {{ padding: 32px 24px; }}
                        .credentials {{ background-color: #F5FAF2; border: 2px dashed #39A900; border-radius: 0.75rem; padding: 20px; margin: 24px 0; }}
                        .label {{ font-size: 0.75rem; color: #007A33; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }}
                        .value {{ font-size: 1rem; font-weight: 700; color: #242424; margin: 0 0 12px 0; }}
                        .footer {{ padding: 24px; text-align: center; border-top: 1px solid #D1D1D1; background-color: #fafafa; }}
                        .footer p {{ margin: 0; font-size: 0.75rem; color: #878787; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header"><h1>SIGI</h1></div>
                        <div class="content">
                            <h2 style="margin-top:0; color:#007A33;">¡Bienvenido, {user.first_name}!</h2>
                            <p>Tu cuenta ha sido creada exitosamente. Estas son tus credenciales de acceso:</p>
                            <div class="credentials">
                                <p class="label">Correo electrónico</p>
                                <p class="value">{user.email}</p>
                                <p class="label">Contraseña temporal</p>
                                <p class="value">{plain_password}</p>
                            </div>
                            <p>Por seguridad, deberás cambiar tu contraseña la primera vez que inicies sesión.</p>
                        </div>
                        <div class="footer">
                            <p>Si no esperabas este correo, por favor contáctanos de inmediato.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                send_mail(
                    subject="Bienvenido a SIGI - Tus credenciales de acceso",
                    message=strip_tags(html_body),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_body,
                    fail_silently=False,
                )
            except Exception as e:
                # El usuario ya fue creado — el fallo del correo no debe revertir la operación
                print(f"Error enviando correo de bienvenida: {e}")

        # Si viene imagen, subirla a Supabase Storage
        file = request.FILES.get('user_image')
        if file:
            file_name = f"{user.id}/{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/user-images/{file_name}"

            response = http_requests.post(
                storage_url,
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                    'Content-Type': file.content_type,
                },
                data=file.read()
            )

            if response.status_code in (200, 201):
                url = f"{settings.SUPABASE_URL}/storage/v1/object/public/user-images/{file_name}"
                user.user_image = url
                user.save()

        log_action(request.user, "CREAR", "Usuario", user.email)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        """GET /api/users/{id}/ — ver detalle de un usuario"""
        deny = deny_if_no_perm(request, 'users.view_users')
        if deny: return deny
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """PUT /api/users/{id}/ — editar usuario"""
        deny = deny_if_no_perm(request, 'users.change_users')
        if deny: return deny
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        # Se guarda el estado previo para detectar una reactivación
        estaba_inactivo = not user.is_active

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # ── Vigencia del usuario ───────────────────────────────────────────────
        # Se evalúan los valores que quedarían DESPUÉS de guardar, leyéndolos de
        # validated_data. Así, si en la misma petición vienen is_active y unas
        # fechas nuevas, se juzga con las fechas nuevas. Va antes del save()
        # para no dejar nada a medias si hay que rechazar.
        nuevo_activo  = serializer.validated_data.get('is_active',        user.is_active)
        nueva_inicio  = serializer.validated_data.get('user_date_start',  user.user_date_start)
        nueva_fin     = serializer.validated_data.get('user_date_end',    user.user_date_end)
        en_vigencia   = esta_dentro_de_vigencia(nueva_inicio, nueva_fin)

        # Activar a alguien fuera de su rango de fechas no sirve de nada:
        # entraría y volvería a bloquearse en el siguiente login, sin que el
        # administrador se entere de por qué.
        if estaba_inactivo and nuevo_activo and not en_vigencia:
            return Response(
                {'error': 'No se puede activar el usuario: hoy está fuera de su rango de fechas. '
                          'Ajusta la fecha de inicio o la fecha fin para que incluyan el día de hoy.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        # Activación automática: si el administrador corrigió las fechas y hoy
        # quedó dentro del rango, no hace falta que además mueva el switch.
        # Antes tocaba hacer las dos cosas por separado.
        aviso = None
        if estaba_inactivo and not nuevo_activo and en_vigencia:
            user.is_active = True
            user.save(update_fields=['is_active'])
            aviso = ('El usuario se activó automáticamente porque el día de hoy '
                     'quedó dentro de su rango de fechas.')

        # Si el administrador reactiva una cuenta que seguía con la contraseña
        # temporal sin cambiar, hay que renovarle el plazo. Si no, el usuario
        # volvería a quedar desactivado en el momento en que intente entrar,
        # porque password_expires_at seguiría estando en el pasado
        # (ver LoginView en auth_views.py).
        if estaba_inactivo and user.is_active and user.must_change_password:
            user.password_expires_at = timezone.now() + timedelta(hours=2)
            user.save(update_fields=['password_expires_at'])
        # Guardar imagen  igual que en create
        file = request.FILES.get('user_image')
        if file:
            file_name = f"{user.id}/{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/user-images/{file_name}"
            response = http_requests.post(
                storage_url,
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                    'Content-Type': file.content_type,
                },
                data=file.read()
            )
            if response.status_code in (200, 201):
                url = f"{settings.SUPABASE_URL}/storage/v1/object/public/user-images/{file_name}"
                user.user_image = url
                user.save()
        log_action(request.user, "EDITAR", "Usuario", user.email)

        # El aviso viaja junto a los datos para que el formulario pueda
        # explicarle al administrador que el usuario se activó solo
        data = UserSerializer(user).data
        if aviso:
            data['aviso'] = aviso
        return Response(data)

    def partial_update(self, request, pk=None):
        """PATCH /api/users/{id}/ — editar campos parciales (ej: is_active)"""
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """DELETE /api/users/{id}/ — desactivar usuario (no elimina de la BD)"""
        deny = deny_if_no_perm(request, 'users.delete_users')
        if deny: return deny
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = False
        user.save()
        log_action(request.user, "DESACTIVAR", "Usuario", user.email)
        return Response({'message': 'Usuario desactivado correctamente'}, status=status.HTTP_200_OK)
    
    #SUBIDA DE IMAGENES A SUPABASE, el campo userImagen solo guarda la url
    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """POST /api/users/{id}/upload-image/ — subir foto de perfil a Supabase Storage"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No se envió ninguna imagen'}, status=status.HTTP_400_BAD_REQUEST)
        #para borrar la anterior imagen de la base de datps de supabase
        if user.user_image:
            # Extraer el path del archivo desde la URL guardada
            old_path = user.user_image.split(f"/storage/v1/object/public/user-images/")[1]
            http_requests.delete(
                f"{settings.SUPABASE_URL}/storage/v1/object/user-images/{old_path}",
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                }
            )

        # Nombre único para evitar colisiones: id del usuario + fheca actual + nombre original
        # Conectar con Supabase Storage directamente via REST API
        file_name = f"{user.id}/{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
        storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/user-images/{file_name}"
        #construccion manual de la peticion http para subir la imagen a supabase storage. se le envia url destino, token en el header, arhcivo como contenido del body
        response = http_requests.post(
            storage_url,
            headers={
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                'apikey': settings.SUPABASE_SERVICE_KEY,
                'Content-Type': file.content_type,
            },
            data=file.read()
        )

        if response.status_code not in (200, 201):
            return Response({'error': 'Error al subir la imagen'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # url puclica
        url = f"{settings.SUPABASE_URL}/storage/v1/object/public/user-images/{file_name}"
        user.user_image = url
        user.save()

        return Response({'message': 'Imagen subida correctamente', 'user_image': url})
    
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """
        POST /api/users/{id}/reset-password/ — el administrador le restablece
        la contraseña a OTRO usuario.

        No confundir con change-password, que actúa sobre request.user (la
        propia). Aquí se genera una contraseña temporal nueva, se envía por
        correo y se reinicia el plazo de 2 horas para cambiarla.
        """
        deny = deny_if_no_perm(request, 'users.change_users')
        if deny: return deny

        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if not user.email:
            return Response(
                {'error': 'El usuario no tiene correo registrado, no se le puede enviar la contraseña.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Misma fórmula que al crear el usuario: nombre + documento + carácter
        nombre    = (user.first_name or 'user').replace(' ', '')
        documento = user.user_document or '0000'
        caracter  = random.choice(list('!.+-*#$%&'))
        nueva_password = f"{nombre}{documento}{caracter}"

        html_body = self._reset_password_email_html(user, nueva_password)
        try:
            send_mail(
                subject="SIGI - Tu contraseña fue restablecida",
                message=strip_tags(html_body),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_body,
                fail_silently=False,
            )
        except Exception as e:
            # Si el correo falla NO se cambia la contraseña: dejaríamos al
            # usuario sin poder entrar y sin saber su clave nueva.
            return Response(
                {'error': f'No se pudo enviar el correo, la contraseña no fue modificada. Detalle: {e}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        user.set_password(nueva_password)
        user.must_change_password = True
        user.password_expires_at  = timezone.now() + timedelta(hours=2)
        # Se corta la sesión que pudiera tener abierta con la clave anterior
        user.current_token_jti = None
        user.current_token_expires_at = None
        user.save(update_fields=[
            'password', 'must_change_password', 'password_expires_at',
            'current_token_jti', 'current_token_expires_at',
        ])

        log_action(request.user, "RESTABLECER CONTRASEÑA", "Usuario", user.email)
        return Response({
            'message': f'Se envió una contraseña temporal a {user.email}. '
                       'El usuario tiene 2 horas para cambiarla.'
        })

    @staticmethod
    def _reset_password_email_html(user, plain_password):
        """Correo de restablecimiento, con el mismo estilo del de bienvenida."""
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif; color: #242424; }}
                .container {{ max-width: 500px; background-color: #ffffff; border-radius: 1rem; border: 2px solid #E1F2D8; margin: 20px auto; overflow: hidden; }}
                .header {{ background: linear-gradient(to right, #72277C, #163F5C); padding: 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 1px; }}
                .content {{ padding: 32px 24px; }}
                .credentials {{ background-color: #F5FAF2; border: 2px dashed #39A900; border-radius: 0.75rem; padding: 20px; margin: 24px 0; }}
                .label {{ font-size: 0.75rem; color: #007A33; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }}
                .value {{ font-size: 1rem; font-weight: 700; color: #242424; margin: 0 0 12px 0; }}
                .footer {{ padding: 24px; text-align: center; border-top: 1px solid #D1D1D1; background-color: #fafafa; }}
                .footer p {{ margin: 0; font-size: 0.75rem; color: #878787; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>SIGI</h1></div>
                <div class="content">
                    <h2 style="margin-top:0; color:#007A33;">Hola, {user.first_name}</h2>
                    <p>Un administrador restableció tu contraseña. Entra con estos datos:</p>
                    <div class="credentials">
                        <p class="label">Correo electrónico</p>
                        <p class="value">{user.email}</p>
                        <p class="label">Contraseña temporal</p>
                        <p class="value">{plain_password}</p>
                    </div>
                    <p>Tienes <strong>2 horas</strong> para iniciar sesión y cambiarla. Pasado ese plazo la cuenta se desactiva y tendrás que pedirle al administrador que la reactive.</p>
                </div>
                <div class="footer">
                    <p>Si no solicitaste este cambio, contacta al administrador de inmediato.</p>
                </div>
            </div>
        </body>
        </html>
        """

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # Verifica que la contraseña actual sea correcta
        if not user.check_password(serializer.validated_data['password_actual']):
            return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        # Cambia la contraseña y desactiva la expiración
        user.set_password(serializer.validated_data['password_nueva'])
        user.must_change_password = False
        user.password_expires_at = None
        user.save()

        return Response({'message': 'Contraseña cambiada correctamente'})
    @action(detail=True, methods=['get', 'post'], url_path='permissions')
    def user_permissions(self, request, pk=None):
        """
        GET  /api/users/{id}/permissions/ — permisos individuales del usuario
        POST /api/users/{id}/permissions/ — asignar permisos individuales
        Body POST: { "permissions": [1, 2, 3] }

        Solo el superusuario puede consultar o modificar permisos.
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo el super administrador puede gestionar los permisos.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            # Permisos individuales (editables desde esta vista)
            perm_ids = list(user.user_permissions.values_list('id', flat=True))
            # Permisos heredados de los grupos del usuario (solo lectura)
            group_perm_ids = list(
                Permission.objects.filter(group__user=user)
                .values_list('id', flat=True)
                .distinct()
            )
            return Response({
                'permissions': perm_ids,
                'group_permissions': group_perm_ids,
            })

        # POST — reemplaza los permisos individuales
        permission_ids = request.data.get('permissions', [])
        perms = Permission.objects.filter(id__in=permission_ids)
        user.user_permissions.set(perms)
        return Response({'message': 'Permisos del usuario actualizados correctamente'})

    #Permite hacer log_out el path = POST /api/users/logout
    @action(detail=False, methods=['post'], url_path='logout')
    def logout(self, request):
        request.user.current_token_jti = None
        request.user.current_token_expires_at = None
        request.user.save()
        return Response({'message': 'Sesión cerrada correctamente'})

    # ──────────────────────────────────────────────────────────────
    # POST /api/users/heartbeat/ — "sigo aquí"
    #
    # El frontend llama esto cada 2 minutos mientras el dashboard está
    # abierto. Si el navegador deja de enviarlo (pestaña cerrada) por más
    # de 5 minutos, JWTSessionAuthentication invalida la sesión en la
    # siguiente petición autenticada. Ver backends.py.
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='heartbeat')
    def heartbeat(self, request):
        request.user.last_heartbeat_at = timezone.now()
        request.user.save(update_fields=['last_heartbeat_at'])
        return Response({'message': 'ok'})

    # ──────────────────────────────────────────────────────────────
    # GET /api/users/me/ — datos del propio usuario logueado
    # No requiere permisos: cualquiera puede ver su propia información
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    # ──────────────────────────────────────────────────────────────
    # GET /api/users/me/permissions/ — permisos del usuario logueado
    # Devuelve strings tipo "app_label.codename" para que el frontend
    # pueda verificar con hasPerm(). El superusuario recibe todos.
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='me/permissions')
    def my_permissions(self, request):
        user = request.user

        if user.is_superuser:
            # get_all_permissions() ya devuelve todos para el superusuario
            perms = Permission.objects.select_related('content_type').all()
            perm_strings = [f"{p.content_type.app_label}.{p.codename}" for p in perms]
        else:
            # Incluye permisos individuales y los heredados de sus grupos
            perm_strings = sorted(user.get_all_permissions())

        return Response({
            'permissions': perm_strings,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
        })


class GroupViewSet(viewsets.ViewSet):
    """
    ViewSet de grupos:
      GET    /api/groups/                    - listar todos los grupos
      POST   /api/groups/                    - crear grupo
      PUT    /api/groups/{id}/               - editar nombre del grupo
      DELETE /api/groups/{id}/               - desactivar grupo (soft delete)
      POST   /api/groups/{id}/permissions/   - asignar permisos al grupo
    """

    def list(self, request):
        """GET /api/groups/ — listar grupos con sus permisos e is_active"""
        deny = deny_if_no_perm(request, 'auth.view_group')
        if deny: return deny
        groups = Group.objects.prefetch_related('permissions', 'profile').all()
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/groups/{id}/ — detalle de un grupo con sus permisos"""
        deny = deny_if_no_perm(request, 'auth.view_group')
        if deny: return deny
        try:
            group = Group.objects.prefetch_related('permissions').get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupSerializer(group)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/groups/ — crear grupo"""
        deny = deny_if_no_perm(request, 'auth.add_group')
        if deny: return deny
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save()
            GroupProfile.objects.create(group=group)
            log_action(request.user, "CREAR", "Grupo", group.name)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """PUT /api/groups/{id}/ — editar nombre y/o estado del grupo"""
        deny = deny_if_no_perm(request, 'auth.change_group')
        if deny: return deny
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        # is_active vive en GroupProfile (tabla separada), se actualiza manualmente
        old_is_active = None
        if 'is_active' in request.data:
            # Misma guardia que en destroy(): un grupo con usuarios adentro no
            # se puede desactivar. Sin esto, un PUT con is_active=false se
            # saltaba la validación y dejaba usuarios en un grupo apagado.
            if not request.data['is_active'] and group.user_set.exists():
                return Response(
                    {'error': 'No se puede desactivar un grupo que tiene usuarios asignados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            profile, _ = GroupProfile.objects.get_or_create(group=group)
            old_is_active = profile.is_active
            profile.is_active = request.data['is_active']
            profile.save()
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Determinar acción comparando el estado anterior con el nuevo
            if old_is_active is not None and profile.is_active != old_is_active:
                accion = "ACTIVAR" if profile.is_active else "DESACTIVAR"
            else:
                accion = "EDITAR"
            log_action(request.user, accion, "Grupo", group.name)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """DELETE /api/groups/{id}/ — desactiva grupo"""
        deny = deny_if_no_perm(request, 'auth.delete_group')
        if deny: return deny
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar si hay usuarios asignados al grupo
        if group.user_set.exists():
            return Response({'error': 'No se puede desactivar un grupo que tiene usuarios asignados'},
            status=status.HTTP_400_BAD_REQUEST
        )
        # Soft delete via GroupProfile (desactivar grupo)
        profile, _ = GroupProfile.objects.get_or_create(group=group)
        profile.is_active = False
        profile.save()
        log_action(request.user, "DESACTIVAR", "Grupo", group.name)
        return Response({'message': 'Grupo desactivado correctamente'})

    @action(detail=True, methods=['post'], url_path='permissions')
    def assign_permissions(self, request, pk=None):
        """POST /api/groups/{id}/permissions/ — asignar permisos al grupo
        Body: { "permissions": [1, 2, 3] }  ← IDs de auth_permission

        Solo el superusuario puede asignar permisos a un grupo.
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo el super administrador puede gestionar los permisos.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        permission_ids = request.data.get('permissions', [])
        permissions = Permission.objects.filter(id__in=permission_ids)
        group.permissions.set(permissions)  # reemplaza todos los permisos del grupo. (borra los viejpos permisos y asigna los id de permisos enviados)
        return Response({'message': 'Permisos asignados correctamente', 'permissions': list(permissions.values('id', 'codename'))})


# Para mostrar los userDocumentType — debe estar FUERA de cualquier clase
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_types(request):
    """GET /api/document-types/ — retorna los tipos de documento disponibles"""
    types = [
        {'value': code, 'label': label}
        for code, label in Users.USER_DOCUMENT_TYPES
    ]
    return Response(types)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_permissions(request):
    """GET /api/permissions/ — retorna los permisos disponibles de los módulos del sistema.

    Solo incluye modelos que tienen verbose_name explícito en su Meta (distinto al
    nombre auto-generado por Django). Eso permite marcar qué modelos se exponen en
    la gestión de permisos sin mantener una lista hardcodeada.

    Solo el superusuario puede consultar la tabla de permisos del sistema.
    """
    if not request.user.is_superuser:
        return Response(
            {'error': 'Solo el super administrador puede gestionar los permisos del sistema.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    import re
    from django.contrib.auth.models import Permission
    from django.apps import apps as django_apps

    def auto_verbose_name(class_name):
        """Reproduce el verbose_name que Django genera automáticamente."""
        s = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', class_name)
        s = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', s)
        return s.lower()

    # Detecta dinámicamente todos los app_labels de los módulos del sistema
    module_app_labels = [
        config.label
        for config in django_apps.get_app_configs()
        if config.name.startswith('backend_sigi.modules')
    ]

    perms = Permission.objects.filter(
        content_type__app_label__in=module_app_labels
    ).select_related('content_type').order_by('content_type__model', 'codename')

    result = []
    model_cache = {}  # {model_name: {include, verbose_name, verbose_name_plural}}

    for perm in perms:
        model_name = perm.content_type.model

        if model_name not in model_cache:
            try:
                model_class = django_apps.get_model(perm.content_type.app_label, model_name)
                auto_name = auto_verbose_name(model_class.__name__)
                explicit = model_class._meta.verbose_name != auto_name
                model_cache[model_name] = {
                    'include': explicit,
                    'verbose_name': model_class._meta.verbose_name,
                    'verbose_name_plural': model_class._meta.verbose_name_plural,
                }
            except Exception:
                model_cache[model_name] = {'include': False}

        entry = model_cache[model_name]
        if not entry.get('include'):
            continue

        result.append({
            'id': perm.id,
            'codename': perm.codename,
            'name': perm.name,
            'content_type__model': model_name,
            'verbose_name': entry['verbose_name'],
            'verbose_name_plural': entry['verbose_name_plural'],
        })

    # El modelo Group es de django.contrib.auth, no de backend_sigi.modules,
    # por lo que el filtro anterior no lo incluye. Se agrega explícitamente
    # porque la gestión de grupos sí es parte del sistema y sus permisos
    # deben poder asignarse desde esta pantalla.
    group_perm_labels = {
        'add_group':    'Crear grupos',
        'view_group':   'Visualizar grupos',
        'change_group': 'Actualizar grupos',
        'delete_group': 'Activar/Desactivar grupos',
    }
    group_perms = Permission.objects.filter(
        content_type__app_label='auth',
        content_type__model='group',
    ).select_related('content_type').order_by('codename')

    for perm in group_perms:
        if perm.codename not in group_perm_labels:
            continue
        result.append({
            'id': perm.id,
            'codename': perm.codename,
            'name': group_perm_labels[perm.codename],
            'content_type__model': 'group',
            'verbose_name': 'grupo',
            'verbose_name_plural': 'grupos',
        })

    return Response(result)
