from django.db import models
from backend_sigi.modules.users.models import Users

class Brand(models.Model):
    """
    Tabla de marcas. Un material solo puede tener una marca (ForeignKey).
    Separada del material para no repetir el nombre si varios materiales
    son de la misma marca.
    """
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'brand'
        verbose_name = 'marca'
        verbose_name_plural = 'marcas'
        permissions = [
            ('listar_brand',           'Listar marcas'),
            ('generar_reporte_brand',  'Generar reporte marcas'),
        ]

    def __str__(self):
        return self.name


class Material(models.Model):
    """
    Clase BASE ABSTRACTA — define todos los campos compartidos entre
    ConsumableMaterial y ReturnableMaterial.
    'abstract = True' significa que Django NO crea una tabla 'material'
    en la BD. Solo sirve como plantilla para las clases que hereden de ella.
    """

    # Estados posibles del material
    # Cuando el material está activo, siempre es 'disponible'
    # Los demás estados son el motivo por el que no está disponible
    MATERIAL_STATES = [
        ('no_disponible', 'No disponible'),
        ('prestado', 'Prestado'),
        ('traslado', 'Traslado'),
        ('baja', 'Baja'),
    ]

    # ForeignKey = relación muchos a uno → muchos materiales, una marca
    # Opcional: hay materiales genéricos que no tienen marca identificable
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,  # PROTECT: no permite borrar una marca si tiene materiales (nunca deberia de ocurrir)
        related_name='%(class)s_set',  # %(class)s se reemplaza por el nombre de la clase hija
        null=True,
        blank=True,
    )

    # Un material puede estar a cargo de varios cuentadantes.
    # Solo usuarios cuentadantes pueden serlo: limit_choices_to filtra
    # automáticamente en el admin y en los serializers.
    #
    # Reemplaza al antiguo inventory_manager (uno solo), que se eliminó
    # después de copiar sus datos aquí.
    inventory_managers = models.ManyToManyField(
        Users,
        limit_choices_to={'is_accountant': True},
        related_name='%(class)s_managed',
        blank=True,   # la obligatoriedad (mínimo 1) la exigen los serializers
    )

    material_name = models.CharField(max_length=150)
    material_description = models.TextField()

    # Modelo del fabricante y S/N (número de serie). Viven aquí y no en
    # ReturnableMaterial porque los materiales de consumo también los
    # necesitan. Opcionales en ambos.
    material_model = models.CharField(max_length=150, blank=True, default='')
    material_serial = models.CharField(max_length=150, blank=True, default='')

    # Fechas de adquisición. Obligatorias en el formulario (los serializers las
    # exigen), pero nullable en la base de datos para no tener que inventarle
    # una fecha de compra a los materiales que ya existían.
    material_purchase_date = models.DateField(null=True, blank=True)
    material_entry_date    = models.DateField(null=True, blank=True)

    # Placa SENA — opcional (blank/null). Si existe → cantidad obligatoriamente 1
    material_barcode_sena = models.CharField(max_length=100, null=True, blank=True)

    material_quantity = models.PositiveIntegerField()

    # Este campo no aparece al crear — empieza en 0 y solo cambia al hacer préstamos
    material_quantity_loaned = models.PositiveIntegerField(default=0)

    material_unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    material_location = models.CharField(max_length=200, blank=True, default='')

    # URL de la imagen guardada en Supabase Storage (igual que en usuarios)
    material_image = models.URLField(null=True, blank=True)

    # Activo = disponible. Inactivo = tiene un motivo en material_state
    is_active = models.BooleanField(default=True)

    # Solo aplica cuando is_active=False. Null cuando está disponible.
    material_state = models.CharField(
        max_length=20,
        choices=MATERIAL_STATES,
        null=True,
        blank=True,
    )

    # @property = campo calculado, no se guarda en BD
    # Se puede leer como material.material_total_price pero no se puede escribir
    @property
    def material_total_price(self):
        """Precio total = cantidad × precio unitario"""
        return self.material_quantity * self.material_unit_price

    @property
    def material_quantity_available(self):
        """Cantidad disponible = total − prestadas"""
        return self.material_quantity - self.material_quantity_loaned

    class Meta:
        abstract = True  # <- esto es lo que hace que no se cree tabla propia


class ConsumableMaterial(Material):
    """
    Hereda todos los campos de Material.
    Los materiales consumibles se gastan con el uso (papelería, insumos, etc.)
    A diferencia de los devolutivos, no se espera que sean retornados.
    """

    class Meta:
        db_table = 'consumable_material'
        verbose_name = 'material de consumo'
        verbose_name_plural = 'materiales de consumo'
        permissions = [
            ('listar_consumablematerial',          'Listar material de consumo'),
            ('generar_reporte_consumablematerial', 'Generar reporte material de consumo'),
        ]

    def __str__(self):
        return self.material_name

class ReturnableMaterial(Material):
    """
    Hereda todos los campos de Material y agrega los específicos
    de materiales devolutivos (se espera que sean retornados).
    """

    CATEGORIES = [
        ('herramienta', 'Herramienta'),
        ('maquinaria_equipos', 'Maquinaria y equipos'),
        ('muebles_enseres', 'Muebles y enseres'),
    ]

    # material_model y material_serial se heredan de Material (los comparte
    # con los consumibles)
    material_category = models.CharField(max_length=20, choices=CATEGORIES)

    # Solo si categoría es 'muebles_enseres' — formato: "120x75x20cm"
    material_dimensions = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'returnable_material'
        verbose_name = 'material devolutivo'
        verbose_name_plural = 'materiales devolutivos'
        permissions = [
            ('listar_returnablematerial',          'Listar material devolutivo'),
            ('generar_reporte_returnablematerial', 'Generar reporte material devolutivo'),
        ]

    def __str__(self):
        return self.material_name

class TechnicalSheetFile(models.Model):
    """
    Tabla separada para los archivos de ficha técnica.
    Un material puede tener varios archivos.

    Sirve para los dos tipos de material. Como Material es abstracto no se le
    puede apuntar con una ForeignKey, así que se usan dos claves foráneas
    nulables y exactamente una debe estar llena. Es el mismo patrón que usa
    LoanItem con consumable_material / returnable_material.

    El campo se sigue llamando 'material' (y no 'returnable_material') para no
    romper los registros ni el código que ya existía.
    """
    material = models.ForeignKey(
        ReturnableMaterial,
        on_delete=models.CASCADE,  # Si se borra el material, se borran sus archivos
        null=True, blank=True,
        related_name='technical_files'
    )
    consumable_material = models.ForeignKey(
        ConsumableMaterial,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='technical_files'
    )
    file_url = models.URLField()
    file_name = models.CharField(max_length=255)  # nombre original del archivo
    uploaded_at = models.DateTimeField(auto_now_add=True)

    @property
    def owner(self):
        """El material dueño del archivo, sea del tipo que sea."""
        return self.material or self.consumable_material

    class Meta:
        db_table = 'technical_sheet_file'
        # Garantiza que nunca queden ambas FK llenas o ambas vacías
        constraints = [
            models.CheckConstraint(
                name='technical_sheet_one_material_type',
                condition=(
                    models.Q(material__isnull=False, consumable_material__isnull=True) |
                    models.Q(material__isnull=True,  consumable_material__isnull=False)
                ),
            )
        ]

    def __str__(self):
        dueno = self.owner
        return f"{dueno.material_name if dueno else 'sin material'} - {self.file_name}"