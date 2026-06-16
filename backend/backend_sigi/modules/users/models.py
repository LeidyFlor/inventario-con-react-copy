from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
from django.utils import timezone
from django.contrib.auth.models import Group

# Create your models here.
class Users(AbstractUser):
    email = models.EmailField(unique=True) # eamil debe ser unico
    USERNAME_FIELD = 'email' # Django usa email para autenticar
    REQUIRED_FIELDS = []      # quita username de los campos requeridos

    #Para indicar el nombre exacto que se quiere en la base de datos
    class Meta:
        db_table = 'users'
#permisos que el usuario pueda elegir, el CRUD convencional django ya lo tiene generado para usuarios add_, view_, change_, delete_(habilitar/deshabilitar)
        permissions = [
        ('listar_usuarios',          'Listar usuarios'),
        ('generar_reporte_usuarios', 'Generar reporte usuarios'),
    ]
    # Validadoar para correo sena y soy.sena
    sena_email_validator = RegexValidator(
        regex=r"^[a-zA-Z0-9._%+-]+@(soy\.)?sena\.edu\.co$",
        message="El correo electrónico debe pertenecer al dominio @sena.edu.co o @soy.sena.edu.co",
        code="invalid_domain", #identificador unico del error
    )
    #Tupla de user_document_types, es una constante
    USER_DOCUMENT_TYPES =(
        ('CC', 'Cédula de Ciudadanía'),
        ('TI', 'Tarjeta de Indentidad'),
        ('PPT', 'Permiso de Protección Temporal'),
        ('PEP', 'Permiso Especial de Permanencia'),
        ('CE', 'Cédula de Extranjería'),
    )
    #MinLengthValidator establece un minimo de caracteres para el campo
    user_document = models.CharField(max_length=20, validators=[MinLengthValidator(5, message="Número de documento inválido")])
    user_email2 = models.EmailField(max_length=254, validators=[sena_email_validator], blank=True) #correo a validar del sena
    user_addres= models.CharField(max_length=100)
    user_tel = models.CharField(max_length=10)
    user_tel2 = models.CharField(max_length=10, blank=True)
    #user_type para despues
    user_document_type = models.CharField(
        max_length=3, 
        choices=USER_DOCUMENT_TYPES,
        default='CC'
    )
    user_date_start = models.DateTimeField(default=timezone.now)
    user_date_end = models.DateTimeField()
    user_image = models.URLField(null=True, blank=True)  # URL pública en Supabase Storage
    is_accountant = models.BooleanField(default=False)   # solo cuentadantes pueden realizar préstamos
    # campos para validacion primera vez de cambio de password
    must_change_password = models.BooleanField(default=False)
    password_expires_at = models.DateTimeField(null=True, blank=True)
    #para no admitir mas de 1 sesion por usuario
    current_token_jti = models.CharField(max_length=255, null=True, blank=True)
    #verifica cuando expiro el token, y en caso de que el usuario no cierre sesión
    current_token_expires_at = models.DateTimeField(null=True, blank=True)

    #MODELO DE GRUPO, solo es para agregar el is_active que no viene por defecto en grupos, de resto django ya tiene creado los demas grupos on delete Cascade es para que en caso de que grupos aunque sea tenga asignado 1 usuario no se pueda deactivar
class GroupProfile(models.Model):
    #OneToOne -> relacion 1 a 1 en MER
    group     = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='profile')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'group_profile'
