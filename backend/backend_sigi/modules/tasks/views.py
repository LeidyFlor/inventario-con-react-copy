from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings

from .models import Task
from .serializers import TaskReadSerializer, TaskModalSerializer, TaskFullSerializer


class TaskViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # ------------------------------------------------------------------
    # GET /api/tasks/          — listar; filtra por ?user=id o ?group=id
    # ------------------------------------------------------------------
    def list(self, request):
        qs = Task.objects.select_related('user', 'group').all()

        user_id  = request.query_params.get('user')
        group_id = request.query_params.get('group')
        if user_id:
            qs = qs.filter(user_id=user_id)
        if group_id:
            qs = qs.filter(group_id=group_id)

        return Response(TaskReadSerializer(qs, many=True).data)

    # ------------------------------------------------------------------
    # POST /api/tasks/         — crear desde gestión de tareas (con user o group)
    # ------------------------------------------------------------------
    def create(self, request):
        serializer = TaskFullSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        task = serializer.save()
        return Response(TaskReadSerializer(task).data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # GET /api/tasks/{id}/
    # ------------------------------------------------------------------
    def retrieve(self, request, pk=None):
        try:
            task = Task.objects.select_related('user', 'group').get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Tarea no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TaskReadSerializer(task).data)

    # ------------------------------------------------------------------
    # PATCH /api/tasks/{id}/
    # ------------------------------------------------------------------
    def partial_update(self, request, pk=None):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Tarea no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskFullSerializer(task, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        task = serializer.save()
        return Response(TaskReadSerializer(task).data)

    # ------------------------------------------------------------------
    # DELETE /api/tasks/{id}/
    # ------------------------------------------------------------------
    def destroy(self, request, pk=None):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Tarea no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ------------------------------------------------------------------
    # POST /api/tasks/for-user/{user_id}/
    # Crea tarea para un usuario ya existente (desde TaskCreateModal en ViewUserPage
    # o como segundo request tras crear usuario en UserRegisterForm).
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path=r'for-user/(?P<user_id>[0-9]+)')
    def for_user(self, request, user_id=None):
        # Importación local para evitar circular import con users
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskModalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        task = serializer.save(user=user)
        return Response(TaskReadSerializer(task).data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # POST /api/tasks/for-group/{group_id}/
    # Crea tarea para un grupo desde TaskCreateModal (si se abre en contexto de grupo).
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path=r'for-group/(?P<group_id>[0-9]+)')
    def for_group(self, request, group_id=None):
        from django.contrib.auth.models import Group

        try:
            group = Group.objects.get(pk=group_id)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskModalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        task = serializer.save(group=group)
        return Response(TaskReadSerializer(task).data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # GET /api/tasks/states/   — devuelve los estados disponibles para selects
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='states')
    def states(self, request):
        return Response([
            {'label': 'Pendiente',   'value': 'pendiente'},
            {'label': 'En progreso', 'value': 'en_progreso'},
            {'label': 'Completada',  'value': 'completada'},
            {'label': 'Cancelada',   'value': 'cancelada'},
        ])
