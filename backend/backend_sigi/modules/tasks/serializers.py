from rest_framework import serializers
from .models import Task


class TaskReadSerializer(serializers.ModelSerializer):
    """Serializer de lectura — incluye nombres resueltos de usuario/grupo."""
    user_name  = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()

    class Meta:
        model  = Task
        fields = [
            'id', 'task_name', 'task_description',
            'task_date_start', 'task_date_end', 'task_state',
            'user', 'group', 'user_name', 'group_name', 'created_at',
        ]

    def get_user_name(self, obj):
        if obj.user:
            return f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return None

    def get_group_name(self, obj):
        return obj.group.name if obj.group else None


class TaskModalSerializer(serializers.ModelSerializer):
    """
    Para crear tarea desde TaskCreateModal (usuario o grupo ya conocido).
    No incluye task_state (el backend usa 'pendiente' por defecto).
    El user/group se inyecta desde la vista.
    """
    class Meta:
        model  = Task
        fields = ['task_name', 'task_description', 'task_date_start', 'task_date_end']


class TaskFullSerializer(serializers.ModelSerializer):
    """
    Para crear/editar tarea desde gestión de tareas.
    Requiere user O group (excluyentes), y permite especificar task_state.
    """
    class Meta:
        model  = Task
        fields = [
            'id', 'task_name', 'task_description',
            'task_date_start', 'task_date_end', 'task_state',
            'user', 'group',
        ]
        extra_kwargs = {
            'user':  {'required': False, 'allow_null': True},
            'group': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        user  = data.get('user',  getattr(self.instance, 'user',  None))
        group = data.get('group', getattr(self.instance, 'group', None))

        if user is not None and group is not None:
            raise serializers.ValidationError(
                'Asigna la tarea a un usuario o a un grupo, no a ambos.'
            )
        if user is None and group is None:
            raise serializers.ValidationError(
                'Debes asignar la tarea a un usuario o a un grupo.'
            )
        return data
