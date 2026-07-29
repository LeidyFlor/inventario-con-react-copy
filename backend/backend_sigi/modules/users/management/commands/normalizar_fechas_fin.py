"""
Pone la fecha de fin indefinida a los usuarios que ya existían antes de que se
agregara esta regla.

    python manage.py normalizar_fechas_fin --dry-run
    python manage.py normalizar_fechas_fin

De aquí en adelante los serializers de crear y editar usuario aplican la regla
solos, así que este comando es de una sola pasada. Se puede volver a correr sin
problema: los usuarios que ya tienen la fecha centinela se saltan.

Aplica a:
  - Superusuarios (is_superuser = True)
  - Integrantes de los grupos listados en constants.GRUPOS_SIN_VENCIMIENTO

Opciones:
  --dry-run   Muestra a quién se le cambiaría la fecha, sin tocar la base de datos
"""
from django.core.management.base import BaseCommand
from django.db.models import Q

from backend_sigi.modules.users.models import Users
from backend_sigi.modules.users.constants import (
    GRUPOS_SIN_VENCIMIENTO,
    es_fecha_fin_indefinida,
    fecha_fin_indefinida,
)


class Command(BaseCommand):
    help = 'Asigna la fecha de fin indefinida a superusuarios y usuarios de planta'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula el cambio: muestra los usuarios afectados sin guardar nada',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        nueva_fecha = fecha_fin_indefinida()

        if dry_run:
            self.stdout.write(self.style.WARNING('MODO SIMULACIÓN — no se guardará ningún cambio\n'))

        # Superusuario o miembro de alguno de los grupos sin vencimiento.
        # distinct() porque el join con grupos puede repetir filas si un usuario
        # pertenece a más de un grupo de la lista.
        candidatos = Users.objects.filter(
            Q(is_superuser=True) | Q(groups__name__in=GRUPOS_SIN_VENCIMIENTO)
        ).distinct().order_by('email')

        actualizados = 0
        omitidos = 0

        for user in candidatos:
            if es_fecha_fin_indefinida(user.user_date_end):
                omitidos += 1
                continue

            motivo = 'superusuario' if user.is_superuser else ', '.join(
                g.name for g in user.groups.all() if g.name in GRUPOS_SIN_VENCIMIENTO
            )
            anterior = user.user_date_end.strftime('%d/%m/%Y') if user.user_date_end else '(sin fecha)'
            self.stdout.write(f'  {user.email} — {motivo} — {anterior} → indefinido')

            if not dry_run:
                user.user_date_end = nueva_fecha
                user.save(update_fields=['user_date_end'])

            actualizados += 1

        # ── Resumen ────────────────────────────────────────────────────────────
        if actualizados == 0:
            self.stdout.write(self.style.SUCCESS(
                f'Todo en orden: los {omitidos} usuarios sin vencimiento ya tenían la fecha correcta.'
            ))
            return

        verbo = 'Se actualizarían' if dry_run else 'Actualizados'
        self.stdout.write(self.style.SUCCESS(
            f'{verbo} {actualizados} usuario(s) | ya estaban correctos: {omitidos}'
        ))
