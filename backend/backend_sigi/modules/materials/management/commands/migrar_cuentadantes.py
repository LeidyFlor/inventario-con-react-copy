"""
Copia el cuentadante antiguo (inventory_manager) al campo nuevo de varios
cuentadantes (inventory_managers).

    python manage.py migrar_cuentadantes --dry-run
    python manage.py migrar_cuentadantes

Es de UNA SOLA PASADA y va entre las dos migraciones:

    1. makemigrations materials + migrate   → crea inventory_managers
    2. python manage.py migrar_cuentadantes → copia los datos   ← este comando
    3. (se elimina inventory_manager del modelo)
       makemigrations materials + migrate   → borra la columna vieja

Si se ejecuta el paso 3 sin haber corrido este comando, los materiales que ya
existían se quedan sin cuentadante.

Se puede volver a correr sin problema: los materiales que ya tienen algún
cuentadante en el campo nuevo se saltan.

Opciones:
  --dry-run   Muestra qué se copiaría sin tocar la base de datos
"""
from django.core.management.base import BaseCommand

from backend_sigi.modules.materials.models import ConsumableMaterial, ReturnableMaterial


class Command(BaseCommand):
    help = 'Copia inventory_manager a inventory_managers en los dos tipos de material'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la copia: muestra los cambios sin guardarlos',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('MODO SIMULACIÓN — no se guardará ningún cambio\n'))

        total_copiados = 0
        total_omitidos = 0
        total_sin_dato = 0

        for modelo, etiqueta in (
            (ReturnableMaterial, 'Material devolutivo'),
            (ConsumableMaterial, 'Material de consumo'),
        ):
            self.stdout.write(self.style.HTTP_INFO(f'\n{etiqueta}'))
            copiados, omitidos, sin_dato = self._procesar(modelo, dry_run)
            total_copiados += copiados
            total_omitidos += omitidos
            total_sin_dato += sin_dato

        # ── Resumen ────────────────────────────────────────────────────────────
        self.stdout.write('')
        if total_copiados == 0 and total_sin_dato == 0:
            self.stdout.write(self.style.SUCCESS(
                f'Todo en orden: los {total_omitidos} materiales ya tenían cuentadante asignado.'
            ))
            return

        verbo = 'Se copiarían' if dry_run else 'Copiados'
        self.stdout.write(self.style.SUCCESS(
            f'{verbo} {total_copiados} material(es) | ya estaban: {total_omitidos}'
        ))
        if total_sin_dato:
            self.stdout.write(self.style.WARNING(
                f'Atención: {total_sin_dato} material(es) quedaron SIN cuentadante porque '
                'tampoco lo tenían antes. Hay que asignárselo desde el formulario de edición.'
            ))

    # ──────────────────────────────────────────────────────────────────────────
    def _procesar(self, modelo, dry_run):
        copiados = omitidos = sin_dato = 0

        materiales = modelo.objects.select_related('inventory_manager') \
                                   .prefetch_related('inventory_managers') \
                                   .order_by('id')

        for material in materiales:
            # Ya tiene cuentadantes en el campo nuevo: nada que hacer
            if material.inventory_managers.exists():
                omitidos += 1
                continue

            antiguo = material.inventory_manager
            if antiguo is None:
                self.stdout.write(self.style.WARNING(
                    f'  {material.material_name}: sin cuentadante que copiar'
                ))
                sin_dato += 1
                continue

            nombre = f'{antiguo.first_name} {antiguo.last_name}'.strip() or antiguo.email
            self.stdout.write(f'  {material.material_name} → {nombre}')

            if not dry_run:
                material.inventory_managers.add(antiguo)
            copiados += 1

        return copiados, omitidos, sin_dato
