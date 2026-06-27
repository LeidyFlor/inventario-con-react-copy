from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('materials', '0004_alter_brand_options_alter_consumablematerial_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='returnablematerial',
            name='material_model',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AlterField(
            model_name='returnablematerial',
            name='material_serial',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]
