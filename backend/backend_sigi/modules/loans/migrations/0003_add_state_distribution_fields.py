from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0002_add_return_accept_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='loanitem',
            name='quantity_bueno',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='loanitem',
            name='quantity_danado',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='loanitem',
            name='quantity_perdido',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
