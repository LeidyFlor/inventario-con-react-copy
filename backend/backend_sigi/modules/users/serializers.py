import random
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import Users, GroupProfile

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
            'is_accountant',
            'user_image',
            'groups',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


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
    password_nueva = serializers.CharField(write_only=True, min_length=8)
    password_nueva_confirmacion = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password_nueva'] != data['password_nueva_confirmacion']:
            raise serializers.ValidationError('Las contraseñas nuevas no coinciden')
        return data
