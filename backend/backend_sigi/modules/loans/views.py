from django.conf import settings
from django.shortcuts import redirect
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import IdentityToken, Loan
from .serializers import (
    LoanListSerializer,
    LoanDetailSerializer,
    LoanCreateSerializer,
    LoanUpdateSerializer,
    LoanReturnSerializer,
    AcceptReturnSerializer,
    IdentityTokenCreateSerializer,
    IdentityConfirmSerializer,
)


class LoanViewSet(viewsets.ViewSet):
    """
    GET    /api/loans/                        - listar préstamos
    POST   /api/loans/                        - crear préstamo
    GET    /api/loans/{id}/                   - detalle préstamo
    PATCH  /api/loans/{id}/                   - editar préstamo
    POST   /api/loans/{id}/return/            - registrar devolución
    POST   /api/loans/identity-token/         - generar token de identidad
    POST   /api/loans/{id}/check-identity/    - verificar si el token fue confirmado
    GET    /api/loans/confirm/{token}/        - link del correo que confirma el token
    """

    permission_classes = [IsAuthenticated]

    # ──────────────────────────────────────────────────────────────
    # LIST  GET /api/loans/
    # ──────────────────────────────────────────────────────────────
    def list(self, request):
        loans = (
            Loan.objects
            .select_related('loan_user_requester', 'loan_user_lender')
            .prefetch_related('items__consumable_material', 'items__returnable_material')
            .order_by('-created_at')
        )
        serializer = LoanDetailSerializer(loans, many=True)
        return Response(serializer.data)

    # ──────────────────────────────────────────────────────────────
    # CREATE  POST /api/loans/
    # ──────────────────────────────────────────────────────────────
    def create(self, request):
        serializer = LoanCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loan = serializer.save()
        return Response(
            LoanDetailSerializer(loan).data,
            status=status.HTTP_201_CREATED,
        )

    # ──────────────────────────────────────────────────────────────
    # RETRIEVE  GET /api/loans/{id}/
    # ──────────────────────────────────────────────────────────────
    def retrieve(self, request, pk=None):
        try:
            loan = (
                Loan.objects
                .select_related('loan_user_requester', 'loan_user_lender')
                .prefetch_related('items__consumable_material', 'items__returnable_material')
                .get(pk=pk)
            )
        except Loan.DoesNotExist:
            return Response({'error': 'Préstamo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LoanDetailSerializer(loan)
        return Response(serializer.data)

    # ──────────────────────────────────────────────────────────────
    # UPDATE  PATCH /api/loans/{id}/
    # ──────────────────────────────────────────────────────────────
    def partial_update(self, request, pk=None):
        try:
            loan = Loan.objects.get(pk=pk)
        except Loan.DoesNotExist:
            return Response({'error': 'Préstamo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LoanUpdateSerializer(loan, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(LoanDetailSerializer(loan).data)

    # ──────────────────────────────────────────────────────────────
    # RETURN  POST /api/loans/{id}/return/
    # Cualquier usuario activo puede registrar la devolución
    # ──────────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='return')
    def return_loan(self, request, pk=None):
        try:
            loan = (
                Loan.objects
                .prefetch_related('items__consumable_material', 'items__returnable_material')
                .get(pk=pk)
            )
        except Loan.DoesNotExist:
            return Response({'error': 'Préstamo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if loan.loan_status == 'finalizado':
            return Response(
                {'error': 'Este préstamo ya está finalizado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoanReturnSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loan = serializer.save(loan=loan)
        return Response(LoanDetailSerializer(loan).data)

    # ──────────────────────────────────────────────────────────────
    # ACCEPT RETURN  POST /api/loans/{id}/accept-return/
    # Solo cuentadantes activos pueden aceptar la devolución
    # ──────────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='accept-return')
    def accept_return(self, request, pk=None):
        # Verificar que el usuario logueado sea cuentadante activo
        if not (request.user.is_accountant and request.user.is_active):
            return Response(
                {'error': 'Solo un cuentadante activo puede aceptar la devolución.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            loan = Loan.objects.select_related(
                'loan_user_requester', 'loan_user_lender', 'returned_by', 'accepted_by'
            ).prefetch_related(
                'items__consumable_material', 'items__returnable_material'
            ).get(pk=pk)
        except Loan.DoesNotExist:
            return Response({'error': 'Préstamo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if not loan.returned_at:
            return Response(
                {'error': 'El préstamo aún no ha sido devuelto.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if loan.accepted_at:
            return Response(
                {'error': 'La devolución de este préstamo ya fue aceptada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AcceptReturnSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loan = serializer.save(loan=loan, accepted_by=request.user)
        return Response(LoanDetailSerializer(loan).data)

    # ──────────────────────────────────────────────────────────────
    # VERIFY TOKEN  POST /api/loans/verify-token/
    # Comprueba si un token fue confirmado — se llama ANTES de crear el préstamo
    # cuando el usuario presiona "Ya confirmé"
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='verify-token')
    def verify_token(self, request):
        token_uuid = request.data.get('token')
        if not token_uuid:
            return Response({'error': 'Token requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token_obj = IdentityToken.objects.get(token=token_uuid, is_confirmed=True)
            return Response({'is_confirmed': True, 'lender_id': token_obj.lender_id})
        except IdentityToken.DoesNotExist:
            return Response({'is_confirmed': False})

    # ──────────────────────────────────────────────────────────────
    # IDENTITY TOKEN  POST /api/loans/identity-token/
    # Genera el token y envía el link por correo al prestador
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='identity-token')
    def create_identity_token(self, request):
        serializer = IdentityTokenCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_obj = serializer.save()

        # URL que se incluye en el correo — el frontend la abre y confirma el token
        confirm_url = f"{request.scheme}://{request.get_host()}/api/loans/confirm/{token_obj.token}/"

        # TODO: enviar correo con confirm_url al prestador (integrar con servicio de email)
        # Por ahora se devuelve la URL en la respuesta para pruebas
        return Response(
            {
                'token': str(token_obj.token),
                'confirm_url': confirm_url,
                'message': 'Token generado. El prestador debe abrir el link enviado a su correo.',
            },
            status=status.HTTP_201_CREATED,
        )

    # ──────────────────────────────────────────────────────────────
    # CHECK IDENTITY  POST /api/loans/{id}/check-identity/
    # El frontend llama esto cuando el usuario presiona "Ya confirmé"
    # ──────────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='check-identity')
    def check_identity(self, request, pk=None):
        try:
            loan = Loan.objects.select_related('identity_token').get(pk=pk)
        except Loan.DoesNotExist:
            return Response({'error': 'Préstamo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = IdentityConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_obj = serializer.context['token_obj']

        loan.identity_confirmed = True
        loan.identity_token     = token_obj
        loan.save(update_fields=['identity_confirmed', 'identity_token', 'updated_at'])

        return Response({'identity_confirmed': True})

    # ──────────────────────────────────────────────────────────────
    # CONFIRM (link del correo)  GET /api/loans/confirm/{token}/
    # El prestador abre este link desde su correo — no requiere login
    # ──────────────────────────────────────────────────────────────
    @action(
        detail=False,
        methods=['get'],
        url_path=r'confirm/(?P<token>[0-9a-f-]+)',
        permission_classes=[],
    )
    def confirm_identity(self, request, token=None):
        try:
            token_obj = IdentityToken.objects.get(token=token, is_confirmed=False)
        except IdentityToken.DoesNotExist:
            return Response(
                {'error': 'Token inválido o ya confirmado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_obj.is_confirmed = True
        token_obj.save(update_fields=['is_confirmed'])

        # Redirige al frontend — la página muestra "Identidad confirmada ✓"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return redirect(f'{frontend_url}/confirm-identity?status=ok')
