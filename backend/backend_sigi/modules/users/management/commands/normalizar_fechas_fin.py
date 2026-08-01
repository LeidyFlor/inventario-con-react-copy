"""
Deja las fechas de fin coherentes con la regla vigente:
solo el superadministrador tiene vencimiento indefinido.

    python manage.py normalizar_fechas_fin --dry-run
    python manage.py normalizar_fechas_fin

Hace dos cosas:

  1. A quien le corresponda vencimiento indefinido (superusuarios, y los grupos
     de constants.GRUPOS_SIN_VENCIMIENTO si algún día se vuelve a llenar) le
     pone la fecha centinela del año 2200.

  2. A quien tenga la fecha centinela SIN corresponderle, le devuelve una fecha
     real: el 31 de diciembre del año en curso. Esto limpia a los usuarios de
     'Administrador' e 'Instructor de Planta', que estuvieron exentos mientras
     esa fue la regla. Es una fecha de arranque razonable; el administrador
     puede ajustarla después desde el formulario de edición.

De aquí en adelante los serializers de crear y editar usuario aplican la regla
solos, así que este comando es de mantenimiento. Se puede volver a correr sin
problema: lo que ya está correcto se salta.

Opciones:
  --dry-run   Muestra los cambios sin tocar la base de datos
"""
from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from backend_sigi.modules.users.models import Users
from backend_sigi.modules.users.constants import (
    es_fecha_fin_indefinida,
    fecha_fin_indefinida,
    tiene_vencimiento_indefinido,
)


def fecha_fin_por_defecto():
    """31 de diciembre del año en curso, a las 23:59."""
    anio = timezone.localdate().year
    return timezone.make_aware(datetime(anio, 12, 31, 23, 59))


class Command(BaseCommand):
    help = 'Deja coherentes las fechas de fin: solo el superadministrador queda indefinido'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula los cambios: muestra qué pasaría sin guardar nada',
        )

    def handle(self, *args, **options):
        dry_run     = options['dry_run']
        centinela   = fecha_fin_indefinida()
        por_defecto = fecha_fin_por_defecto()

        if dry_run:
            self.stdout.write(self.style.WARNING('MODO SIMULACIÓN — no se guardará ningún cambio\n'))

        puestos    = 0   # se les asignó la fecha indefinida
        devueltos  = 0   # se les devolvió una fecha real
        correctos  = 0

        # prefetch_related evita una consulta de grupos por cada usuario
        for user in Users.objects.prefetch_related('groups').order_by('email'):
            corresponde = tiene_vencimiento_indefinido(user=user)
            tiene       = es_fecha_fin_indefinida(user.user_date_end)

            if corresponde and not tiene:
                anterior = self._fmt(user.user_date_end)
                self.stdout.write(
                    f'  {user.email} — superadministrador — {anterior} → indefinido'
                )
                if not dry_run:
                    user.user_date_end = centinela
                    user.save(update_fields=['user_date_end'])
                puestos += 1

            elif tiene and not corresponde:
                # Quedó con la fecha del 2200 cuando 'Administrador' e
                # 'Instructor de Planta' estaban exentos. Ya no aplica.
                grupos = ', '.join(g.name for g in user.groups.all()) or 'sin grupo'
                self.stdout.write(self.style.WARNING(
                    f'  {user.email} — {grupos} — indefinido → {self._fmt(por_defecto)} (revisar)'
                ))
                if not dry_run:
                    user.user_date_end = por_defecto
                    user.save(update_fields=['user_date_end'])
                devueltos += 1

            else:
                correctos += 1

        # ── Resumen ────────────────────────────────────────────────────────────
        if puestos == 0 and devueltos == 0:
            self.stdout.write(self.style.SUCCESS(
                f'Todo en orden: los {correctos} usuarios ya tenían la fecha correcta.'
            ))
            return

        verbo = 'Se aplicarían' if dry_run else 'Aplicados'
        self.stdout.write(self.style.SUCCESS(
            f'{verbo} {puestos + devueltos} cambio(s): '
            f'{puestos} a indefinido, {devueltos} con fecha real | sin cambios: {correctos}'
        ))
        if devueltos:
            self.stdout.write(
                'Revisa los marcados en amarillo: quedaron con el 31 de diciembre de este '
                'año y conviene ajustarles la fecha real desde el formulario de edición.'
            )

    @staticmethod
    def _fmt(fecha):
        return fecha.strftime('%d/%m/%Y') if fecha else '(sin fecha)'
