from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from backend_sigi.utils.audit import log_action
from backend_sigi.utils.perm_check import deny_if_no_perm
from django.utils import timezone
from django.db.models import Count
import requests as http_requests

from .models import Brand, ConsumableMaterial, ReturnableMaterial, TechnicalSheetFile
from .serializers import (
    BrandSerializer,
    ConsumableMaterialSerializer,
    ConsumableMaterialCreateSerializer,
    ConsumableMaterialUpdateSerializer,
    ReturnableMaterialSerializer,
    ReturnableMaterialCreateSerializer,
    ReturnableMaterialUpdateSerializer,
    TechnicalSheetFileSerializer,
)
from backend_sigi.modules.users.models import Users
from backend_sigi.modules.users.serializers import UserSerializer


# ──────────────────────────────────────────────────────────────────────────────
# FICHAS TÉCNICAS — helpers compartidos
#
# Los dos tipos de material manejan fichas técnicas exactamente igual, así que
# la lógica vive aquí y los dos ViewSets la reutilizan en vez de duplicarla.
# ──────────────────────────────────────────────────────────────────────────────

BUCKET = 'material-data-sheet'


def subir_fichas_tecnicas(material, files, carpeta, es_consumible):
    """
    Sube los archivos a Supabase Storage y crea los TechnicalSheetFile.

    TechnicalSheetFile tiene dos claves foráneas nulables (una por tipo de
    material) porque Material es abstracto y no se le puede apuntar. Por eso
    hace falta saber cuál de las dos llenar.

    Devuelve la lista de registros creados, ya serializados.
    """
    creados = []
    for archivo in files:
        marca_tiempo = timezone.now().strftime('%Y%m%d_%H%M%S%f')
        file_name = f"{carpeta}/{material.id}/ficha_{marca_tiempo}_{archivo.name}"

        response = http_requests.post(
            f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET}/{file_name}",
            headers={
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                'apikey': settings.SUPABASE_SERVICE_KEY,
                'Content-Type': archivo.content_type,
            },
            data=archivo.read()
        )
        if response.status_code in (200, 201):
            url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{file_name}"
            dueno = (
                {'consumable_material': material} if es_consumible
                else {'material': material}
            )
            registro = TechnicalSheetFile.objects.create(
                file_url=url,
                file_name=archivo.name,
                **dueno,
            )
            creados.append(TechnicalSheetFileSerializer(registro).data)

    return creados


def borrar_ficha_de_storage(tech_file):
    """Elimina el archivo físico de Supabase. El registro se borra aparte."""
    ruta = tech_file.file_url.split(f'/public/{BUCKET}/')[1]
    http_requests.delete(
        f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET}/{ruta}",
        headers={
            'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
            'apikey': settings.SUPABASE_SERVICE_KEY,
        }
    )


def falta_ficha_tecnica(request):
    """
    True si la petición de creación no trae ninguna ficha técnica.

    La ficha es obligatoria en los dos tipos de material, pero no puede
    validarse en el serializer: los archivos no viajan en los campos del
    modelo sino en request.FILES.
    """
    return not request.FILES.getlist('technical_files')


ERROR_SIN_FICHA = {'technical_files': 'Debes adjuntar al menos una ficha técnica.'}
ERROR_ULTIMA_FICHA = {
    'error': 'No se puede eliminar la única ficha técnica del material. '
             'Sube una nueva antes de borrar esta.'
}


class BrandViewSet(viewsets.ViewSet):
    """
    GET    /api/brands/        - listar marcas
    POST   /api/brands/        - crear marca
    PUT    /api/brands/{id}/   - editar marca
    DELETE /api/brands/{id}/   - desactivar marca (soft delete)
    """

    def list(self, request):
        deny = deny_if_no_perm(request, 'materials.listar_brand')
        if deny: return deny
        # El conteo va anotado para que el serializer no haga dos consultas
        # por cada fila
        brands = Brand.objects.annotate(
            materials_count_annotated=(
                Count('returnablematerial_set', distinct=True) +
                Count('consumablematerial_set', distinct=True)
            )
        )
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data)

    def create(self, request):
        deny = deny_if_no_perm(request, 'materials.add_brand')
        if deny: return deny
        serializer = BrandSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        brand = serializer.save()
        log_action(request.user, "CREAR", "Marca", brand.name)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.change_brand')
        if deny: return deny
        try:
            brand = Brand.objects.get(pk=pk)
        except Brand.DoesNotExist:
            return Response({'error': 'Marca no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        old_is_active = brand.is_active
        serializer = BrandSerializer(brand, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        if 'is_active' in request.data and brand.is_active != old_is_active:
            accion = "ACTIVAR" if brand.is_active else "DESACTIVAR"
        else:
            accion = "EDITAR"
        log_action(request.user, accion, "Marca", brand.name)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.delete_brand')
        if deny: return deny
        try:
            brand = Brand.objects.get(pk=pk)
        except Brand.DoesNotExist:
            return Response({'error': 'Marca no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        brand.is_active = False
        brand.save()
        log_action(request.user, "DESACTIVAR", "Marca", brand.name)
        return Response({'message': 'Marca desactivada correctamente'})

class ConsumableMaterialViewSet(viewsets.ViewSet):
    """
    GET    /api/consumable-materials/             - listar
    POST   /api/consumable-materials/             - crear
    GET    /api/consumable-materials/{id}/        - detalle
    PUT    /api/consumable-materials/{id}/        - editar
    DELETE /api/consumable-materials/{id}/        - desactivar
    POST   /api/consumable-materials/{id}/upload-image/  - subir imagen
    """
    def list(self, request):
        deny = deny_if_no_perm(request, 'materials.listar_consumablematerial')
        if deny: return deny
        materials = ConsumableMaterial.objects.select_related(
            'brand', 'inventory_name', 'category'
        ).prefetch_related('technical_files', 'inventory_managers').all()
        serializer = ConsumableMaterialSerializer(materials, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.view_consumablematerial')
        if deny: return deny
        try:
            material = ConsumableMaterial.objects.select_related(
                'brand', 'inventory_name', 'category'
            ).prefetch_related('technical_files', 'inventory_managers').get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ConsumableMaterialSerializer(material).data)

    def create(self, request):
        deny = deny_if_no_perm(request, 'materials.add_consumablematerial')
        if deny: return deny

        # Se revisa antes del serializer para no crear el material y quedarnos
        # a medias si no venía la ficha
        if falta_ficha_tecnica(request):
            return Response(ERROR_SIN_FICHA, status=status.HTTP_400_BAD_REQUEST)

        serializer = ConsumableMaterialCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        material = serializer.save()

        # Subir imagen si viene en el request
        file = request.FILES.get('material_image')
        if file:
            file_name = f"materials/{material.id}/{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{file_name}"

            response = http_requests.post(
                storage_url,
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                    'Content-Type': file.content_type,
                },
                data=file.read()
            )

            if response.status_code in (200, 201):
                url = f"{settings.SUPABASE_URL}/storage/v1/object/public/material-data-sheet/{file_name}"
                material.material_image = url
                material.save()

        # Fichas técnicas — obligatorias, ya se validó que vienen
        subir_fichas_tecnicas(
            material,
            request.FILES.getlist('technical_files'),
            carpeta='consumable',
            es_consumible=True,
        )

        log_action(request.user, "CREAR", "Material de consumo", material.material_name)
        return Response(ConsumableMaterialSerializer(material).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.change_consumablematerial')
        if deny: return deny
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        old_is_active = material.is_active
        serializer = ConsumableMaterialUpdateSerializer(material, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # Reemplazar imagen si viene en el request
        file = request.FILES.get('material_image')
        if file:
            if material.material_image:
                old_path = material.material_image.split('/public/material-data-sheet/')[1]
                http_requests.delete(
                    f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{old_path}",
                    headers={
                        'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                        'apikey': settings.SUPABASE_SERVICE_KEY,
                    }
                )
            file_name = f"materials/{material.id}/{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            response = http_requests.post(
                f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{file_name}",
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                    'Content-Type': file.content_type,
                },
                data=file.read()
            )
            if response.status_code in (200, 201):
                material.material_image = f"{settings.SUPABASE_URL}/storage/v1/object/public/material-data-sheet/{file_name}"
                material.save()

        # Determinar acción comparando el estado anterior con el nuevo
        if 'is_active' in request.data and material.is_active != old_is_active:
            accion = "ACTIVAR" if material.is_active else "DESACTIVAR"
        else:
            accion = "EDITAR"
        log_action(request.user, accion, "Material de consumo", material.material_name)
        return Response(ConsumableMaterialSerializer(material).data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.delete_consumablematerial')
        if deny: return deny
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        material.is_active = False
        material.save()
        log_action(request.user, "DESACTIVAR", "Material de consumo", material.material_name)
        return Response({'message': 'Material desactivado correctamente'})

    @action(detail=True, methods=['post'], url_path='upload-technical-files')
    def upload_technical_files(self, request, pk=None):
        """Sube una o más fichas técnicas y las registra en TechnicalSheetFile"""
        deny = deny_if_no_perm(request, 'materials.change_consumablematerial')
        if deny: return deny
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        files = request.FILES.getlist('technical_files')
        if not files:
            return Response({'error': 'No se enviaron archivos'}, status=status.HTTP_400_BAD_REQUEST)

        creados = subir_fichas_tecnicas(
            material, files, carpeta='consumable', es_consumible=True
        )
        return Response({'uploaded': creados}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'delete-technical-file/(?P<file_id>\d+)')
    def delete_technical_file(self, request, pk=None, file_id=None):
        """Elimina una ficha técnica del material y de Supabase Storage"""
        deny = deny_if_no_perm(request, 'materials.change_consumablematerial')
        if deny: return deny
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            tech_file = TechnicalSheetFile.objects.get(pk=file_id, consumable_material=material)
        except TechnicalSheetFile.DoesNotExist:
            return Response({'error': 'Ficha técnica no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # La ficha técnica es obligatoria: no se puede dejar al material sin ninguna
        if material.technical_files.count() <= 1:
            return Response(ERROR_ULTIMA_FICHA, status=status.HTTP_400_BAD_REQUEST)

        borrar_ficha_de_storage(tech_file)
        tech_file.delete()  # Las fichas técnicas sí se eliminan físicamente
        return Response({'message': 'Ficha técnica eliminada'})

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """Reemplaza la imagen del material en Supabase Storage"""
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('material_image')
        if not file:
            return Response({'error': 'No se envió ninguna imagen'}, status=status.HTTP_400_BAD_REQUEST)

        # Borrar imagen anterior si existe
        if material.material_image:
            old_path = material.material_image.split('/public/material-data-sheet/')[1]
            http_requests.delete(
                f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{old_path}",
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                }
            )

        file_name = f"materials/{material.id}/{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
        storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{file_name}"

        response = http_requests.post(
            storage_url,
            headers={
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                'apikey': settings.SUPABASE_SERVICE_KEY,
                'Content-Type': file.content_type,
            },
            data=file.read()
        )

        if response.status_code not in (200, 201):
            return Response({'error': 'Error al subir la imagen'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        url = f"{settings.SUPABASE_URL}/storage/v1/object/public/material-data-sheet/{file_name}"
        material.material_image = url
        material.save()
        return Response({'message': 'Imagen actualizada', 'material_image': url})

class ReturnableMaterialViewSet(viewsets.ViewSet):
    """
    GET    /api/returnable-materials/                            - listar
    POST   /api/returnable-materials/                            - crear
    GET    /api/returnable-materials/{id}/                       - detalle
    PUT    /api/returnable-materials/{id}/                       - editar
    PATCH  /api/returnable-materials/{id}/                       - editar parcial
    DELETE /api/returnable-materials/{id}/                       - desactivar
    POST   /api/returnable-materials/{id}/upload-image/          - subir imagen principal
    POST   /api/returnable-materials/{id}/upload-technical-files/- subir fichas técnicas
    DELETE /api/returnable-materials/{id}/delete-technical-file/{file_id}/ - eliminar ficha
    """

    def list(self, request):
        deny = deny_if_no_perm(request, 'materials.listar_returnablematerial')
        if deny: return deny
        materials = ReturnableMaterial.objects.select_related(
            'brand', 'inventory_name', 'category'
        ).prefetch_related('technical_files', 'inventory_managers').all()
        serializer = ReturnableMaterialSerializer(materials, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.view_returnablematerial')
        if deny: return deny
        try:
            material = ReturnableMaterial.objects.select_related(
                'brand', 'inventory_name', 'category'
            ).prefetch_related('technical_files', 'inventory_managers').get(pk=pk)
        except ReturnableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReturnableMaterialSerializer(material).data)

    def create(self, request):
        deny = deny_if_no_perm(request, 'materials.add_returnablematerial')
        if deny: return deny

        # Se revisa antes del serializer para no crear el material y quedarnos
        # a medias si no venía la ficha
        if falta_ficha_tecnica(request):
            return Response(ERROR_SIN_FICHA, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReturnableMaterialCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        material = serializer.save()

        # Subir imagen principal si viene en el request
        file = request.FILES.get('material_image')
        if file:
            file_name = f"returnable/{material.id}/img_{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            storage_url = f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{file_name}"

            response = http_requests.post(
                storage_url,
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                    'Content-Type': file.content_type,
                },
                data=file.read()
            )
            if response.status_code in (200, 201):
                url = f"{settings.SUPABASE_URL}/storage/v1/object/public/material-data-sheet/{file_name}"
                material.material_image = url
                material.save()

        # Fichas técnicas — obligatorias, ya se validó que vienen.
        # El frontend las envía como múltiples campos llamados "technical_files"
        subir_fichas_tecnicas(
            material,
            request.FILES.getlist('technical_files'),
            carpeta='returnable',
            es_consumible=False,
        )

        log_action(request.user, "CREAR", "Material devolutivo", material.material_name)
        return Response(ReturnableMaterialSerializer(material).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.change_returnablematerial')
        if deny: return deny
        try:
            material = ReturnableMaterial.objects.get(pk=pk)
        except ReturnableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        old_is_active = material.is_active
        serializer = ReturnableMaterialUpdateSerializer(material, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # Subir imagen si se reemplaza
        file = request.FILES.get('material_image')
        if file:
            if material.material_image:
                old_path = material.material_image.split('/public/material-data-sheet/')[1]
                http_requests.delete(
                    f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{old_path}",
                    headers={
                        'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                        'apikey': settings.SUPABASE_SERVICE_KEY,
                    }
                )

            file_name = f"returnable/{material.id}/img_{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
            response = http_requests.post(
                f"{settings.SUPABASE_URL}/storage/v1/object/material-data-sheet/{file_name}",
                headers={
                    'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                    'Content-Type': file.content_type,
                },
                data=file.read()
            )
            if response.status_code in (200, 201):
                url = f"{settings.SUPABASE_URL}/storage/v1/object/public/material-data-sheet/{file_name}"
                material.material_image = url
                material.save()

        # Determinar acción comparando el estado anterior con el nuevo
        if 'is_active' in request.data and material.is_active != old_is_active:
            accion = "ACTIVAR" if material.is_active else "DESACTIVAR"
        else:
            accion = "EDITAR"
        log_action(request.user, accion, "Material devolutivo", material.material_name)
        return Response(ReturnableMaterialSerializer(material).data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        deny = deny_if_no_perm(request, 'materials.delete_returnablematerial')
        if deny: return deny
        try:
            material = ReturnableMaterial.objects.get(pk=pk)
        except ReturnableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        material.is_active = False
        material.save()
        log_action(request.user, "DESACTIVAR", "Material devolutivo", material.material_name)
        return Response({'message': 'Material desactivado correctamente'})

    @action(detail=True, methods=['post'], url_path='upload-technical-files')
    def upload_technical_files(self, request, pk=None):
        """Sube una o más fichas técnicas y las registra en TechnicalSheetFile"""
        deny = deny_if_no_perm(request, 'materials.change_returnablematerial')
        if deny: return deny
        try:
            material = ReturnableMaterial.objects.get(pk=pk)
        except ReturnableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        files = request.FILES.getlist('technical_files')
        if not files:
            return Response({'error': 'No se enviaron archivos'}, status=status.HTTP_400_BAD_REQUEST)

        creados = subir_fichas_tecnicas(
            material, files, carpeta='returnable', es_consumible=False
        )
        return Response({'uploaded': creados}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'delete-technical-file/(?P<file_id>\d+)')
    def delete_technical_file(self, request, pk=None, file_id=None):
        """Elimina una ficha técnica del material y de Supabase Storage"""
        deny = deny_if_no_perm(request, 'materials.change_returnablematerial')
        if deny: return deny
        try:
            material = ReturnableMaterial.objects.get(pk=pk)
        except ReturnableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            tech_file = TechnicalSheetFile.objects.get(pk=file_id, material=material)
        except TechnicalSheetFile.DoesNotExist:
            return Response({'error': 'Ficha técnica no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # La ficha técnica es obligatoria: no se puede dejar al material sin ninguna
        if material.technical_files.count() <= 1:
            return Response(ERROR_ULTIMA_FICHA, status=status.HTTP_400_BAD_REQUEST)

        borrar_ficha_de_storage(tech_file)
        tech_file.delete()  # Las fichas técnicas sí se eliminan físicamente
        return Response({'message': 'Ficha técnica eliminada'})


# Endpoint para el select de cuentadantes en el formulario de materiales
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_managers(request):
    """GET /api/inventory-managers/ — retorna solo usuarios con is_accountant=True"""
    # prefetch_related por lo mismo que en la lista de usuarios:
    # UserSerializer.get_groups consulta los grupos de cada uno
    managers = Users.objects.filter(
        is_accountant=True, is_active=True
    ).prefetch_related('groups')
    serializer = UserSerializer(managers, many=True)
    return Response(serializer.data)