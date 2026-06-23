from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.auth.models import Group, Permission
from .models import Users, GroupProfile
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer, ChangePasswordSerializer, GroupSerializer
from django.conf import settings
from supabase import create_client
from django.utils import timezone
import requests as http_requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import resend

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
        users = Users.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/users/ — crear nuevo usuario"""
        serializer = UserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Enviar correo con la contraseña temporal generada
        plain_password = getattr(user, '_plain_password', None)
        if plain_password:
            try:
                resend.api_key = settings.RESEND_API_KEY
                resend.Emails.send({
                    "from": settings.DEFAULT_FROM_EMAIL,
                    "to": [user.email],
                    "subject": "Bienvenido a SIGI - Tus credenciales de acceso",
                    "html": f"""
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
                    """,
                })
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

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        """GET /api/users/{id}/ — ver detalle de un usuario"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """PUT /api/users/{id}/ — editar usuario"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
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
        # retorna informacion ca,biada y la imagen cuando ya fue cargada
        return Response(UserSerializer(user).data)

    def partial_update(self, request, pk=None):
        """PATCH /api/users/{id}/ — editar campos parciales (ej: is_active)"""
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """DELETE /api/users/{id}/ — desactivar usuario (no elimina de la BD)"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = False
        user.save()
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
        """
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            perm_ids = list(user.user_permissions.values_list('id', flat=True))
            return Response({'permissions': perm_ids})

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
        groups = Group.objects.prefetch_related('permissions', 'profile').all()
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/groups/{id}/ — detalle de un grupo con sus permisos"""
        try:
            group = Group.objects.prefetch_related('permissions').get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupSerializer(group)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/groups/ — crear grupo"""
        serializer = GroupSerializer(data=request.data)
        #primero guarda al grupo basico y luego el "perfil" con el active=true
        if serializer.is_valid():
            group = serializer.save()                   # asignar resultado
            GroupProfile.objects.create(group=group)    # crear profile con is_active=True
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """PUT /api/groups/{id}/ — editar nombre del grupo"""
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado'}, status=status.HTTP_404_NOT_FOUND) #partial=true modifica solo lo que le fue enviado
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """DELETE /api/groups/{id}/ — desactiva grupo"""
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
        return Response({'message': 'Grupo desactivado correctamente'})

    @action(detail=True, methods=['post'], url_path='permissions')
    def assign_permissions(self, request, pk=None):
        """POST /api/groups/{id}/permissions/ — asignar permisos al grupo
        Body: { "permissions": [1, 2, 3] }  ← IDs de auth_permission
        """
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
    """GET /api/permissions/ — retorna los permisos disponibles de los módulos del sistema"""
    from django.contrib.auth.models import Permission
    # Solo permisos de los módulos propios (users y materials)
    perms = Permission.objects.filter(
        content_type__app_label__in=['users', 'materials']
    ).values('id', 'codename', 'name', 'content_type__model').order_by('content_type__model', 'codename')
    return Response(list(perms))
