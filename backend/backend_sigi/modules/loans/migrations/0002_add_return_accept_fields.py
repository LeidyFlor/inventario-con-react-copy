from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── LoanItem: item_state ─────────────────────────────────────────────
        migrations.AddField(
            model_name='loanitem',
            name='item_state',
            field=models.CharField(
                choices=[
                    ('bueno',   'Bueno'),
                    ('dañado',  'Dañado'),
                    ('perdido', 'Perdido'),
                ],
                default='bueno',
                max_length=10,
            ),
        ),

        # ── Loan: campos de devolución ───────────────────────────────────────
        migrations.AddField(
            model_name='loan',
            name='returned_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='loans_returned',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='loan',
            name='returned_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='return_observations',
            field=models.TextField(blank=True, default=''),
        ),

        # ── Loan: campos de aceptación ───────────────────────────────────────
        migrations.AddField(
            model_name='loan',
            name='accepted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='loans_accepted',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='loan',
            name='accepted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='accept_observations',
            field=models.TextField(blank=True, default=''),
        ),
    ]
