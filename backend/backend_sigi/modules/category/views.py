from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.response import Response

from backend_sigi.utils.audit import log_action
from backend_sigi.utils.perm_check import deny_if_no_perm

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ViewSet):
    """
    GET    /api/categories/        - listar categorías
    POST   /api/categories/        - crear
    GET    /api/categories/{id}/   - detalle
    PUT    /api/categories/{id}/   - editar nombre y/o estado
    PATCH  /api/categories/{id}/   - editar parcial
    DELETE /api/categories/{id}/   - desactivar (borrado lógico)

    Igual que marcas y nombres de inventario: nunca se elimina un registro,
    solo se desactiva, porque puede haber materiales que lo referencien.
    """

    def list(self, request):
        deny = deny_if_no_perm(request, 'category.listar_category')
        if deny: return deny
        # El conteo va anotado para que el serializer no haga dos consultas
        # por cada fila
        categorias = Category.objects.annotate(
            materials_count_annotated=(
                Count('returnablematerial_set', distinct=True) +
                Count('consumablematerial_set', distinct=True)
            )
        ).order_by('name')
        serializer = CategorySerializer(categorias, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        deny = deny_if_no_perm(request, 'category.view_category')
        if deny: return deny
        try:
            categoria = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response(
                {'error': 'Categoría no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(CategorySerializer(categoria).data)

    def create(self, request):
        deny = deny_if_no_perm(request, 'category.add_category')
        if deny: return deny
        serializer = CategorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        categoria = serializer.save()
        log_action(request.user, "CREAR", "Categoría", categoria.name)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        deny = deny_if_no_perm(request, 'category.change_category')
        if deny: return deny
        try:
            categoria = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response(
                {'error': 'Categoría no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )

        estado_anterior = categoria.is_active
        serializer = CategorySerializer(categoria, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # Se distingue en el registro de auditoría si fue un cambio de estado
        # o una edición del nombre
        if 'is_active' in request.data and categoria.is_active != estado_anterior:
            accion = "ACTIVAR" if categoria.is_active else "DESACTIVAR"
        else:
            accion = "EDITAR"
        log_action(request.user, accion, "Categoría", categoria.name)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        deny = deny_if_no_perm(request, 'category.delete_category')
        if deny: return deny
        try:
            categoria = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response(
                {'error': 'Categoría no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )
        categoria.is_active = False
        categoria.save()
        log_action(request.user, "DESACTIVAR", "Categoría", categoria.name)
        return Response({'message': 'Categoría desactivada correctamente'})
