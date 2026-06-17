from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone
import requests as http_requests

from .models import Brand, ConsumableMaterial
from .serializers import (
    BrandSerializer,
    ConsumableMaterialSerializer,
    ConsumableMaterialCreateSerializer,
    ConsumableMaterialUpdateSerializer,
)
from backend_sigi.modules.users.models import Users
from backend_sigi.modules.users.serializers import UserSerializer

class BrandViewSet(viewsets.ViewSet):
    """
    GET    /api/brands/        - listar marcas
    POST   /api/brands/        - crear marca
    PUT    /api/brands/{id}/   - editar marca
    DELETE /api/brands/{id}/   - desactivar marca (soft delete)
    """

    def list(self, request):
        brands = Brand.objects.all()
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = BrandSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        try:
            brand = Brand.objects.get(pk=pk)
        except Brand.DoesNotExist:
            return Response({'error': 'Marca no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BrandSerializer(brand, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        try:
            brand = Brand.objects.get(pk=pk)
        except Brand.DoesNotExist:
            return Response({'error': 'Marca no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        brand.is_active = False
        brand.save()
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
    #Listar todos los materiales
    def list(self, request):
        materials = ConsumableMaterial.objects.select_related('brand', 'inventory_manager').all()
        serializer = ConsumableMaterialSerializer(materials, many=True)
        return Response(serializer.data)
    #Visualizar de un solo elemento
    def retrieve(self, request, pk=None):
        try:
            material = ConsumableMaterial.objects.select_related('brand', 'inventory_manager').get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ConsumableMaterialSerializer(material).data)

    def create(self, request):
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

        return Response(ConsumableMaterialSerializer(material).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ConsumableMaterialUpdateSerializer(material, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(ConsumableMaterialSerializer(material).data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        try:
            material = ConsumableMaterial.objects.get(pk=pk)
        except ConsumableMaterial.DoesNotExist:
            return Response({'error': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        material.is_active = False
        material.save()
        return Response({'message': 'Material desactivado correctamente'})

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

# Endpoint para el select de cuentadantes en el formulario de materiales
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_managers(request):
    """GET /api/inventory-managers/ — retorna solo usuarios con is_accountant=True"""
    managers = Users.objects.filter(is_accountant=True, is_active=True)
    serializer = UserSerializer(managers, many=True)
    return Response(serializer.data)