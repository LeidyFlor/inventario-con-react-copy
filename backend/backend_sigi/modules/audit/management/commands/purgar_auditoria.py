"""
Borra los registros de auditoría más viejos que el plazo indicado.

    python manage.py purgar_auditoria --dry-run
    python manage.py purgar_auditoria
    python manage.py purgar_auditoria --dias 90

NO es un comando de una sola pasada: está pensado para correr por cron, igual
que enviar_recordatorios. Sin él la tabla audit_log crece sin límite.

El plazo por defecto son 31 días, que es el mismo que conservaba la rotación
del archivo de log al que reemplazó esta tabla.

Opciones:
  --dry-run     Muestra cuántos se borrarían, sin tocar la base de datos
  --dias N      Días a conservar (por defecto 31)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from backend_sigi.modules.audit.models import AuditLog


DIAS_POR_DEFECTO = 31


class Command(BaseCommand):
    help = 'Elimina los registros de auditoría anteriores al plazo indicado'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la purga: informa cuántos registros se borrarían',
        )
        parser.add_argument(
            '--dias',
            type=int,
            default=DIAS_POR_DEFECTO,
            help=f'Días de historial a conservar (por defecto {DIAS_POR_DEFECTO})',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        dias    = options['dias']

        if dias < 1:
            self.stderr.write(self.style.ERROR('El plazo debe ser de al menos 1 día.'))
            return

        corte = timezone.now() - timedelta(days=dias)
        viejos = AuditLog.objects.filter(created_at__lt=corte)
        cantidad = viejos.count()

        if dry_run:
            self.stdout.write(self.style.WARNING('MODO SIMULACIÓN — no se borrará nada\n'))

        self.stdout.write(
            f"Corte: {timezone.localtime(corte):%Y-%m-%d %H:%M} "
            f"(se conservan los últimos {dias} días)"
        )

        if cantidad == 0:
            self.stdout.write(self.style.SUCCESS('No hay registros para purgar.'))
            return

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'Se borrarían {cantidad} registro(s).'))
            return

        viejos.delete()
        self.stdout.write(self.style.SUCCESS(f'Se borraron {cantidad} registro(s).'))
