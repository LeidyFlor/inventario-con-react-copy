from django.db import models
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError


class Task(models.Model):
    TASK_STATES = [
        ('pendiente',   'Pendiente'),
        ('en_progreso', 'En progreso'),
        ('completada',  'Completada'),
        ('cancelada',   'Cancelada'),
    ]

    task_name        = models.CharField(max_length=30)
    task_description = models.CharField(max_length=254)
    task_date_start  = models.DateField()
    task_date_end    = models.DateField()
    task_state       = models.CharField(max_length=20, choices=TASK_STATES, default='pendiente')

    # Exactamente uno de los dos debe estar presente (usuario O grupo)
    user  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='tasks',
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='tasks',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task'
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(user__isnull=False, group__isnull=True) |
                    models.Q(user__isnull=True,  group__isnull=False)
                ),
                name='task_user_or_group_exclusive',
            )
        ]

    def clean(self):
        if self.user_id is not None and self.group_id is not None:
            raise ValidationError(
                'Una tarea debe asignarse a un usuario o a un grupo, no a ambos.'
            )
        if self.user_id is None and self.group_id is None:
            raise ValidationError(
                'Una tarea debe asignarse a un usuario o a un grupo.'
            )

    def __str__(self):
        assigned = f'usuario {self.user_id}' if self.user_id else f'grupo {self.group_id}'
        return f'{self.task_name} ({assigned})'
