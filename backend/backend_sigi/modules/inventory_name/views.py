from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.response import Response

from backend_sigi.utils.audit import log_action
from backend_sigi.utils.perm_check import deny_if_no_perm

from .models import InventoryName
from .serializers import InventoryNameSerializer


class InventoryNameViewSet(viewsets.ViewSet):
    """
    GET    /api/inventory-names/        - listar nombres de inventario
    POST   /api/inventory-names/        - crear
    GET    /api/inventory-names/{id}/   - detalle
    PUT    /api/inventory-names/{id}/   - editar nombre y/o estado
    PATCH  /api/inventory-names/{id}/   - editar parcial
    DELETE /api/inventory-names/{id}/   - desactivar (borrado lógico)

    Mismo comportamiento que el CRUD de marcas: nunca se elimina un registro,
    solo se desactiva, porque puede haber materiales que lo referencien.
    """

    def list(self, request):
        deny = deny_if_no_perm(request, 'inventory_name.listar_inventoryname')
        if deny: return deny
        # El conteo va anotado para que el serializer no haga dos consultas
        # por cada fila
        inventarios = InventoryName.objects.annotate(
            materials_count_annotated=(
                Count('returnablematerial_set', distinct=True) +
                Count('consumablematerial_set', distinct=True)
            )
        ).order_by('name')
        serializer = InventoryNameSerializer(inventarios, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        deny = deny_if_no_perm(request, 'inventory_name.view_inventoryname')
        if deny: return deny
        try:
            inventario = InventoryName.objects.get(pk=pk)
        except InventoryName.DoesNotExist:
            return Response(
                {'error': 'Nombre de inventario no encontrado'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(InventoryNameSerializer(inventario).data)

    def create(self, request):
        deny = deny_if_no_perm(request, 'inventory_name.add_inventoryname')
        if deny: return deny
        serializer = InventoryNameSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        inventario = serializer.save()
        log_action(request.user, "CREAR", "Nombre de inventario", inventario.name)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        deny = deny_if_no_perm(request, 'inventory_name.change_inventoryname')
        if deny: return deny
        try:
            inventario = InventoryName.objects.get(pk=pk)
        except InventoryName.DoesNotExist:
            return Response(
                {'error': 'Nombre de inventario no encontrado'},
                status=status.HTTP_404_NOT_FOUND,
            )

        estado_anterior = inventario.is_active
        serializer = InventoryNameSerializer(inventario, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # Se distingue en el registro de auditoría si fue un cambio de estado
        # o una edición del nombre
        if 'is_active' in request.data and inventario.is_active != estado_anterior:
            accion = "ACTIVAR" if inventario.is_active else "DESACTIVAR"
        else:
            accion = "EDITAR"
        log_action(request.user, accion, "Nombre de inventario", inventario.name)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        deny = deny_if_no_perm(request, 'inventory_name.delete_inventoryname')
        if deny: return deny
        try:
            inventario = InventoryName.objects.get(pk=pk)
        except InventoryName.DoesNotExist:
            return Response(
                {'error': 'Nombre de inventario no encontrado'},
                status=status.HTTP_404_NOT_FOUND,
            )
        inventario.is_active = False
        inventario.save()
        log_action(request.user, "DESACTIVAR", "Nombre de inventario", inventario.name)
        return Response({'message': 'Nombre de inventario desactivado correctamente'})
