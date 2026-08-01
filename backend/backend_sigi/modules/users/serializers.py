import random
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import Users, GroupProfile
from .constants import fecha_fin_indefinida, tiene_vencimiento_indefinido
from backend_sigi.utils.password_rules import errores_de_password


def grupo_activo(group):
    """
    True si el grupo está habilitado.

    is_active no vive en Group sino en GroupProfile (tabla aparte). Los grupos
    creados antes de esa funcionalidad no tienen profile y se asumen activos,
    igual que hace GroupSerializer.
    """
    profile = getattr(group, 'profile', None)
    return profile.is_active if profile else True


def _error_grupos_desactivados(grupos):
    """Mensaje de error compartido por los serializers de crear y editar."""
    nombres = ', '.join(g.name for g in grupos)
    return serializers.ValidationError(
        f'No se pueden asignar grupos desactivados: {nombres}. '
        'Actívalos en Gestión de grupos si necesitas usarlos.'
    )


class UserSerializer(serializers.ModelSerializer):
    """Serializer para listar y ver detalle de usuarios"""
    groups = serializers.SerializerMethodField()

    def get_groups(self, obj):
        return [{'id': g.id, 'name': g.name} for g in obj.groups.all()]

    class Meta:
        model = Users
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'user_email2',
            'user_document_type',
            'user_document',
            'user_addres',
            'user_tel',
            'user_tel2',
            'user_date_start',
            'user_date_end',
            'is_active',
            'is_staff',
            # Se expone solo para lectura: el frontend lo necesita para saber
            # que al superadministrador tampoco le aplica la fecha de fin.
            'is_superuser',
            'is_accountant',
            'user_image',
            'groups',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined', 'is_superuser']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios — incluye password y grupos obligatorios"""
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=True  # obligatorio al crear
    )

    class Meta:
        model = Users
        fields = [
            'first_name',
            'last_name',
            'email',
            'user_email2',
            'user_document_type',
            'user_document',
            'user_addres',
            'user_tel',
            'user_tel2',
            'user_date_start',
            'user_date_end',
            'is_accountant',
            'is_staff',
            'groups',
        ]

    def validate_groups(self, value):
        """Un usuario nuevo no puede quedar en un grupo desactivado."""
        desactivados = [g for g in value if not grupo_activo(g)]
        if desactivados:
            raise _error_grupos_desactivados(desactivados)
        return value

    def create(self, validated_data):
        groups = validated_data.pop('groups')  # sacar antes de crear (es ManyToMany, no va en el constructor)

        special_char = list('!.+-*#$%&') #lista de caracteres especiales
          # Construir contraseña: nombre + documento + carácter aleatorio, el replace('') quita los espacios que podría tener un nombre compuesto (Ana María) -> (AnaMaria)
        nombre = validated_data.get('first_name', 'user').replace(' ', '')
        #usa el numero de comeunto del usuario, en caso de que no existiera este campo, se usa el '0000'
        documento = validated_data.get('user_document', '0000')
        caracter = random.choice(special_char) #elige un caracter de la lista
        password = f"{nombre}{documento}{caracter}" #concatena la contraseña

        # Configurar campos de expiración
        validated_data['username'] = validated_data['email'] #se accede con el correo electronico
        validated_data['must_change_password'] = True #validador único para calidar cambio de contraseña por primera vez, despues pasa a ser False
        validated_data['password_expires_at'] = timezone.now() + timedelta(hours=2) #el usuario no cambia la clave en < 2h = usuario desactivado

        # Usuarios de planta: la fecha de fin que venga del formulario se ignora
        # y se reemplaza por la centinela. El frontend esconde el campo, pero la
        # decisión se toma aquí para que valga también si alguien llama la API
        # directamente.
        if tiene_vencimiento_indefinido(group_names=[g.name for g in groups]):
            validated_data['user_date_end'] = fecha_fin_indefinida()

        #desempaqueta el diccionario de datos de usuario validados, instancia temporal del modelo de usuarios (todavia no se guarda en la bd)
        user = Users(**validated_data)
        user.set_password(password) #hash de la contraseña, nativo de django
        user.save() #guarda los datos en la tabla en la bd

        user.groups.set(groups)  # asignar grupos después de guardar (necesita ID en la BD)

        # Guardamos la contraseña en texto plano como atributo temporal
        # para que el view la pueda enviar por correo (no se persiste en la BD)
        user._plain_password = password
        return user


    """Serializer para editar usuarios — sin password"""
class UserUpdateSerializer(serializers.ModelSerializer):
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False
    )
    email = serializers.EmailField(required=False)

    def validate_groups(self, value):
        """
        No se pueden agregar grupos desactivados.

        Los que el usuario YA tenía sí se dejan pasar: si un grupo se desactivó
        con gente adentro (datos viejos), esta validación no debe impedir que se
        edite el resto del perfil ni obligar a sacarlo del grupo a la fuerza.
        """
        actuales = set(self.instance.groups.values_list('id', flat=True)) if self.instance else set()
        nuevos_desactivados = [
            g for g in value if g.id not in actuales and not grupo_activo(g)
        ]
        if nuevos_desactivados:
            raise _error_grupos_desactivados(nuevos_desactivados)
        return value

    def validate_email(self, value):
        # Obtiene el usuario que se está editando
        user = self.instance
        # Verifica si otro usuario ya tiene ese correo
        if Users.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Este correo ya está registrado por otro usuario.")
        return value
    class Meta:
        model = Users
        fields = [
            'first_name',
            'last_name',
            'email',
            'user_email2',
            'user_document_type',
            'user_document',
            'user_addres',
            'user_tel',
            'user_tel2',
            'user_date_start',
            'user_date_end',
            'is_active',
            'is_accountant',
            'is_staff',
            'groups',
        ]
    def update(self, instance, validated_data): #se activa automaticamente
        groups = validated_data.pop('groups', None)
        # Si cambia el email, sincronizar el username
        if 'email' in validated_data:
            validated_data['username'] = validated_data['email']
        instance = super().update(instance, validated_data)
        if groups is not None:
            instance.groups.set(groups)

        # Se evalúa después de asignar los grupos, porque el usuario pudo
        # acabar de entrar (o salir) de un grupo sin vencimiento en esta misma
        # edición. Si deja de ser de planta, la fecha centinela se conserva:
        # quitarla exigiría inventar una fecha nueva, así que eso queda a cargo
        # del administrador editando el campo, que vuelve a estar visible.
        if tiene_vencimiento_indefinido(user=instance):
            nueva_fecha = fecha_fin_indefinida()
            if instance.user_date_end != nueva_fecha:
                instance.user_date_end = nueva_fecha
                instance.save(update_fields=['user_date_end'])

        return instance

class GroupSerializer(serializers.ModelSerializer):
    """Serializer para listar y gestionar grupos"""
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True  # los permisos se asignan por separado
    )
    # is_active viene del GroupProfile relacionado (profile es el related_name)
    is_active = serializers.SerializerMethodField()

    def get_is_active(self, obj):
        # Si aún no tiene profile (grupo creado antes de esta feature), se asume activo
        if hasattr(obj, 'profile'):
            return obj.profile.is_active
        return True

    class Meta:
        model = Group
        fields = ['id', 'name', 'is_active', 'permissions']


class ChangePasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    # Sin min_length: la longitud la revisa errores_de_password junto con el
    # resto de reglas, para que todos los mensajes salgan del mismo lugar
    password_nueva = serializers.CharField(write_only=True)
    password_nueva_confirmacion = serializers.CharField(write_only=True)

    def validate_password_nueva(self, value):
        """
        Mismas reglas que el esquema Zod del frontend: mínimo 8 caracteres,
        una mayúscula, una minúscula, un número y un carácter especial.
        """
        errores = errores_de_password(value)
        if errores:
            raise serializers.ValidationError(errores)
        return value

    def validate(self, data):
        if data['password_nueva'] != data['password_nueva_confirmacion']:
            raise serializers.ValidationError('Las contraseñas nuevas no coinciden')
        if data['password_nueva'] == data['password_actual']:
            raise serializers.ValidationError('La nueva contraseña debe ser distinta a la actual')
        return data
