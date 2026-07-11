from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0003_add_state_distribution_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='loan',
            name='loan_status',
            field=models.CharField(
                choices=[
                    ('activo',               'Activo'),
                    ('devolucion_parcial',   'Devolución parcial'),
                    ('en_espera_aceptacion', 'En espera de aceptación'),
                    ('finalizado',           'Finalizado'),
                    ('pendiente',            'Pendiente'),
                ],
                default='activo',
                max_length=20,
            ),
        ),
    ]
