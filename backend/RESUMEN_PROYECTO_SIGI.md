# Resumen Backend SIGI — Estado actual

## Estructura del proyecto

```
bakend django/
├── manage.py
├── requirements.txt
├── .env                          ← credenciales reales (no subir a git)
├── .env.example                  ← plantilla sin datos sensibles
├── RESUMEN_PROYECTO_SIGI.md
└── backend_sigi/
    ├── api/
    │   ├── settings.py
    │   ├── urls.py
    │   ├── wsgi.py
    │   └── asgi.py
    └── modules/
        └── users/
            ├── models.py
            ├── serializers.py
            ├── views.py
            ├── auth_views.py
            ├── backends.py
            ├── urls.py
            ├── apps.py
            └── admin.py
```

---

## 1. Dependencias — `requirements.txt`

```
Django>=6.0.6
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
djangorestframework>=3.15.0
djangorestframework-simplejwt>=5.3.0
```

Instalación:
```bash
pip install -r requirements.txt
```

---

## 2. Variables de entorno — `.env.example`

```env
# Django
SECRET_KEY=tu-secret-key-aqui
DEBUG=True

# Supabase - PostgreSQL (Session Pooler para redes IPv4)
# Valores en: Supabase → Settings → Database → Session Pooler
DB_NAME=postgres
DB_USER=postgres.acwnkaahiwfgiuabgcih
DB_PASSWORD=tu-password-aqui
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=5432
```

> Se usa **Session Pooler** (no Direct Connection) para compatibilidad con redes IPv4.

---

## 3. Configuración principal — `backend_sigi/api/settings.py`

```python
from datetime import timedelta
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', '...')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'backend_sigi.modules.users',   # módulo de usuarios
]

AUTH_USER_MODEL = 'users.Users'     # modelo de usuario personalizado

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Zona horaria Colombia
TIME_ZONE = 'America/Bogota'

WSGI_APPLICATION = 'backend_sigi.api.wsgi.application'
ROOT_URLCONF = 'backend_sigi.api.urls'

# Conexión a Supabase (PostgreSQL con SSL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', ''),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', ''),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# DRF: autenticación por JWT con validación de sesión única
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'backend_sigi.modules.users.backends.JWTSessionAuthentication',
    ),
}

# JWT: access dura 8h, refresh dura 1 día
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
```

---

## 4. URLs globales — `backend_sigi/api/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from backend_sigi.modules.users.auth_views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend_sigi.modules.users.urls')),
    path('api/auth/login', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

---

## 5. Modelo de usuarios — `backend_sigi/modules/users/models.py`

Extiende `AbstractUser` de Django. Autentica con **email** en lugar de username.

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
from django.utils import timezone

class Users(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'      # nombre exacto de la tabla en Supabase

    sena_email_validator = RegexValidator(
        regex=r"^[a-zA-Z0-9._%+-]+@(soy\.)?sena\.edu\.co$",
        message="El correo debe ser @sena.edu.co o @soy.sena.edu.co",
    )

    USER_DOCUMENT_TYPES = (
        ('CC',  'Cédula de Ciudadanía'),
        ('TI',  'Tarjeta de Identidad'),
        ('PPT', 'Permiso de Protección Temporal'),
        ('PEP', 'Permiso Especial de Permanencia'),
        ('CE',  'Cédula de Extranjería'),
    )

    user_document      = models.CharField(max_length=20, validators=[MinLengthValidator(5)])
    user_email2        = models.EmailField(max_length=254, validators=[sena_email_validator])
    user_addres        = models.CharField(max_length=100)
    user_tel           = models.CharField(max_length=10)
    user_tel2          = models.CharField(max_length=10)
    user_document_type = models.CharField(max_length=3, choices=USER_DOCUMENT_TYPES, default='CC')
    user_date_start    = models.DateTimeField(default=timezone.now)
    user_date_end      = models.DateTimeField()

    # Control de primer cambio de contraseña
    must_change_password = models.BooleanField(default=False)
    password_expires_at  = models.DateTimeField(null=True, blank=True)

    # Control de sesión única por usuario
    current_token_jti        = models.CharField(max_length=255, null=True, blank=True)
    current_token_expires_at = models.DateTimeField(null=True, blank=True)
```

**Campos heredados de AbstractUser (no se declaran, vienen de Django):**
`id`, `username`, `first_name`, `last_name`, `password`, `is_active`, `is_staff`, `is_superuser`, `date_joined`, `last_login`, grupos y permisos.

---

## 6. Serializers — `backend_sigi/modules/users/serializers.py`

```python
import random
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from .models import Users

# Para listar y ver detalle — sin contraseña
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = [
            'id', 'first_name', 'last_name', 'email', 'user_email2',
            'user_document_type', 'user_document', 'user_addres',
            'user_tel', 'user_tel2', 'user_date_start', 'user_date_end',
            'is_active', 'is_staff', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


# Para crear usuarios — genera contraseña automática
class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = [
            'first_name', 'last_name', 'email', 'user_email2',
            'user_document_type', 'user_document', 'user_addres',
            'user_tel', 'user_tel2', 'user_date_start', 'user_date_end',
        ]

    def create(self, validated_data):
        special_char = list('!.+-*#$%&')
        nombre    = validated_data.get('first_name', 'user').replace(' ', '')
        documento = validated_data.get('user_document', '0000')
        caracter  = random.choice(special_char)
        password  = f"{nombre}{documento}{caracter}"   # ej: Ana12345678!

        validated_data['username']             = validated_data['email']
        validated_data['must_change_password'] = True
        validated_data['password_expires_at']  = timezone.now() + timedelta(hours=2)

        user = Users(**validated_data)
        user.set_password(password)   # hashea la contraseña
        user.save()

        print(f"Contraseña generada para {user.email}: {password}")  # TODO: enviar por correo
        return user


# Para editar usuarios — sin contraseña
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = [
            'first_name', 'last_name', 'user_email2', 'user_document_type',
            'user_document', 'user_addres', 'user_tel', 'user_tel2',
            'user_date_start', 'user_date_end', 'is_active',
        ]


# Para cambiar contraseña
class ChangePasswordSerializer(serializers.Serializer):
    password_actual            = serializers.CharField(write_only=True)
    password_nueva             = serializers.CharField(write_only=True, min_length=8)
    password_nueva_confirmacion = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password_nueva'] != data['password_nueva_confirmacion']:
            raise serializers.ValidationError('Las contraseñas nuevas no coinciden')
        return data
```

---

## 7. Vistas — `backend_sigi/modules/users/views.py`

```python
from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Users
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer, ChangePasswordSerializer

class UserViewSet(viewsets.ViewSet):

    def list(self, request):
        """GET /api/users/ — lista TODOS los usuarios (activos e inactivos)"""
        users = Users.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/users/ — crear usuario con contraseña auto-generada"""
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """GET /api/users/{id}/ — ver detalle de un usuario"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def update(self, request, pk=None):
        """PUT /api/users/{id}/ — editar campos del usuario"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """DELETE /api/users/{id}/ — soft delete: is_active = False"""
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = False
        user.save()
        return Response({'message': 'Usuario desactivado correctamente'})

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """POST /api/users/change-password/ — primer cambio o cambio manual"""
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['password_actual']):
            return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['password_nueva'])
        user.must_change_password = False
        user.password_expires_at  = None
        user.save()
        return Response({'message': 'Contraseña cambiada correctamente'})

    @action(detail=False, methods=['post'], url_path='logout')
    def logout(self, request):
        """POST /api/users/logout/ — invalida el token de sesión"""
        request.user.current_token_jti        = None
        request.user.current_token_expires_at = None
        request.user.save()
        return Response({'message': 'Sesión cerrada correctamente'})
```

---

## 8. Vista de login — `backend_sigi/modules/users/auth_views.py`

```python
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
        email    = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        # Bloquear si ya hay sesión activa y no ha expirado
        if user.current_token_jti and user.current_token_expires_at:
            if timezone.now() < user.current_token_expires_at:
                return Response(
                    {'error': 'Ya hay una sesión activa con este usuario'},
                    status=status.HTTP_409_CONFLICT
                )

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access  = refresh.access_token

        # Registrar sesión activa en la BD
        user.current_token_jti        = str(access['jti'])
        user.current_token_expires_at = timezone.now() + timedelta(hours=8)
        user.save()

        return Response({
            'access':               str(access),
            'refresh':              str(refresh),
            'must_change_password': user.must_change_password,
            'user':                 UserSerializer(user).data
        })
```

---

## 9. Backend de autenticación JWT — `backend_sigi/modules/users/backends.py`

Valida que el token que envía React sea el mismo registrado en la BD. Esto impide que dos dispositivos usen el mismo usuario simultáneamente.

```python
from .models import Users
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

class JWTSessionAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)   # valida firma y expiración
        jti  = str(validated_token['jti'])

        if user.current_token_jti != jti:
            raise InvalidToken('La sesión fue iniciada en otro dispositivo, o ya expiró')

        return user
```

---

## 10. URLs del módulo usuarios — `backend_sigi/modules/users/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## 11. Registro de la app — `backend_sigi/modules/users/apps.py`

```python
from django.apps import AppConfig

class UsersConfig(AppConfig):
    name = 'backend_sigi.modules.users'
```

---

## 12. Admin — `backend_sigi/modules/users/admin.py`

```python
from django.contrib import admin
from .models import Users

admin.site.register(Users)
```

---

## 13. Comandos de gestión

```bash
# Desde la carpeta raíz (donde está manage.py)

# Crear migraciones del módulo users
python manage.py makemigrations users

# Aplicar migraciones a Supabase
python manage.py migrate

# Iniciar servidor de desarrollo
python manage.py runserver
```

---

## 14. Endpoints disponibles

| Método | URL | Descripción | Auth requerida |
|--------|-----|-------------|----------------|
| POST | `/api/auth/login` | Login con email/password | No |
| POST | `/api/auth/refresh/` | Renovar access token | No (requiere refresh token) |
| GET | `/api/users/` | Listar todos los usuarios | Sí |
| POST | `/api/users/` | Crear usuario | No (primer admin) |
| GET | `/api/users/{id}/` | Ver detalle de usuario | Sí |
| PUT | `/api/users/{id}/` | Editar usuario | Sí |
| DELETE | `/api/users/{id}/` | Desactivar usuario (soft delete) | Sí |
| POST | `/api/users/change-password/` | Cambiar contraseña | Sí |
| POST | `/api/users/logout/` | Cerrar sesión | Sí |

---

## 15. Flujo completo de un usuario nuevo

```
1. Admin crea usuario → POST /api/users/
   └─ Se genera contraseña automática: {nombre}{documento}{caracter_especial}
   └─ must_change_password = True
   └─ password_expires_at = now + 2 horas
   └─ Se imprime en consola (TODO: enviar por correo)

2. Usuario inicia sesión → POST /api/auth/login
   └─ Si credenciales incorrectas → 401
   └─ Si ya hay sesión activa → 409
   └─ Si ok → retorna access + refresh + must_change_password + datos del usuario

3. Si must_change_password = true → frontend redirige a cambio de contraseña
   └─ POST /api/users/change-password/ (con Bearer token)
   └─ must_change_password = False, password_expires_at = None

4. Uso normal → React envía Bearer token en cada petición
   └─ JWTSessionAuthentication valida firma + jti contra BD

5. Logout → POST /api/users/logout/
   └─ current_token_jti = None
   └─ Cualquier petición posterior con ese token es rechazada
```

---

## 16. Pendiente / Próximos pasos

- [ ] Envío real de contraseña por correo (actualmente usa `print()`)
- [ ] Campo `user_image` + integración con Supabase Storage
- [ ] Módulo de grupos (usando `auth_group` de Django)
- [ ] Otros módulos: marcas, materiales, préstamos, tareas
- [ ] Configurar CORS para conectar con frontend React Vite
- [ ] Implementar `sendBeacon` en React para logout al cerrar el navegador
