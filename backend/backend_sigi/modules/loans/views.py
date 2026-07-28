from django.conf import settings
from django.shortcuts import redirect
from django.core.mail import send_mail
from django.utils.html import strip_tags
from backend_sigi.utils.audit import log_action
from backend_sigi.utils.perm_check import deny_if_no_perm
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from django.db import transaction
from .models import IdentityToken, Loan, LoanItem
from backend_sigi.modules.materials.models import ConsumableMaterial, ReturnableMaterial
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
        deny = deny_if_no_perm(request, 'loans.listar_loan')
        if deny: return deny
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
        deny = deny_if_no_perm(request, 'loans.add_loan')
        if deny: return deny
        serializer = LoanCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loan = serializer.save()
        log_action(request.user, "CREAR", "Préstamo", loan.loan_code)
        return Response(
            LoanDetailSerializer(loan).data,
            status=status.HTTP_201_CREATED,
        )

    # ──────────────────────────────────────────────────────────────
    # RETRIEVE  GET /api/loans/{id}/
    # ──────────────────────────────────────────────────────────────
    def retrieve(self, request, pk=None):
        deny = deny_if_no_perm(request, 'loans.view_loan')
        if deny: return deny
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
        deny = deny_if_no_perm(request, 'loans.change_loan')
        if deny: return deny
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
        deny = deny_if_no_perm(request, 'loans.change_loan')
        if deny: return deny
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

        if loan.accepted_at:
            return Response(
                {'error': 'La devolución ya fue aceptada por el cuentadante y no puede modificarse.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoanReturnSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loan = serializer.save(loan=loan)
        log_action(request.user, "DEVOLVER", "Préstamo", loan.loan_code)
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

        if loan.loan_status != 'en_espera_aceptacion':
            if loan.loan_status == 'finalizado':
                return Response(
                    {'error': 'Este préstamo ya está finalizado.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {'error': 'Solo se puede aceptar la devolución cuando todos los materiales devolutivos han sido devueltos.'},
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
        log_action(request.user, "APROBAR_DEVOLUCIÓN", "Préstamo", loan.loan_code)
        return Response(LoanDetailSerializer(loan).data)

    # ──────────────────────────────────────────────────────────────
    # REMOVE ITEM  DELETE /api/loans/{id}/items/{item_id}/
    # Elimina un ítem del préstamo y restaura el inventario.
    # Solo permitido en préstamos activos o con devolución parcial.
    # ──────────────────────────────────────────────────────────────
    @action(detail=True, methods=['delete'], url_path=r'items/(?P<item_id>[0-9]+)')
    @transaction.atomic
    def remove_item(self, request, pk=None, item_id=None):
        BLOCKED_STATUSES = ['finalizado', 'en_espera_aceptacion']

        try:
            loan = Loan.objects.get(pk=pk)
        except Loan.DoesNotExist:
            return Response({'error': 'Préstamo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if loan.loan_status in BLOCKED_STATUSES:
            return Response(
                {'error': 'No se puede modificar un préstamo finalizado o en espera de aceptación.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item = LoanItem.objects.select_related(
                'consumable_material', 'returnable_material'
            ).get(pk=item_id, loan=loan)
        except LoanItem.DoesNotExist:
            return Response({'error': 'Ítem no encontrado en este préstamo.'}, status=status.HTTP_404_NOT_FOUND)

        if loan.items.count() <= 1:
            return Response(
                {'error': 'El préstamo debe tener al menos un material.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restaurar inventario según tipo de material
        if item.material_type == 'consumable':
            ConsumableMaterial.objects.filter(pk=item.consumable_material_id).update(
                material_quantity=item.consumable_material.material_quantity + item.quantity_loaned
            )
        else:
            ReturnableMaterial.objects.filter(pk=item.returnable_material_id).update(
                material_quantity_loaned=item.returnable_material.material_quantity_loaned - item.quantity_loaned
            )

        item.delete()
        return Response(LoanDetailSerializer(loan).data, status=status.HTTP_200_OK)

    # ──────────────────────────────────────────────────────────────
    # SEARCH BY CODE  GET /api/loans/search/?code=AAA000000008
    # Devuelve el id del préstamo dado su loan_code
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='search')
    def search_by_code(self, request):
        deny = deny_if_no_perm(request, 'loans.view_loan')
        if deny: return deny
        code = request.query_params.get('code', '').strip().upper()
        if not code:
            return Response({'error': 'Parámetro code requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            loan = Loan.objects.get(loan_code=code)
            return Response({'id': loan.id})
        except Loan.DoesNotExist:
            return Response({'error': f'No se encontró el préstamo "{code}".'}, status=status.HTTP_404_NOT_FOUND)

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
            token_obj = IdentityToken.objects.get(token=token_uuid)
        except IdentityToken.DoesNotExist:
            return Response({
                'is_confirmed': False,
                'lender_confirmed': False,
                'requester_confirmed': False,
            })

        # Se devuelve el estado de cada parte para que el frontend muestre
        # cuál falta por confirmar, no solo un sí/no global
        return Response({
            'is_confirmed':        token_obj.is_confirmed,
            'lender_confirmed':    token_obj.lender_confirmed,
            'requester_confirmed': token_obj.requester_confirmed,
            'lender_id':           token_obj.lender_id,
            'requester_id':        token_obj.requester_id,
        })

    # ──────────────────────────────────────────────────────────────
    # IDENTITY TOKEN  POST /api/loans/identity-token/
    # Genera el token y envía un enlace distinto a cada parte:
    # el prestador (cuentadante) y el solicitante (quien recibe).
    # El préstamo solo puede crearse cuando AMBOS confirmen.
    # ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='identity-token')
    def create_identity_token(self, request):
        serializer = IdentityTokenCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_obj = serializer.save()

        base_url = f"{request.scheme}://{request.get_host()}/api/loans/confirm/{token_obj.token}"
        # Cada parte recibe un enlace con su rol, para saber cuál de las dos confirmó
        lender_url    = f"{base_url}/lender/"
        requester_url = f"{base_url}/requester/"

        errores = []
        for persona, url, rol_texto in (
            (token_obj.lender,    lender_url,    "entregarás"),
            (token_obj.requester, requester_url, "recibirás"),
        ):
            html_body = self._identity_email_html(persona, url, rol_texto)
            try:
                send_mail(
                    subject="SIGI - Confirmación de identidad para préstamo",
                    message=strip_tags(html_body),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[persona.email],
                    html_message=html_body,
                    fail_silently=False,
                )
            except Exception as e:
                errores.append(f"{persona.email}: {e}")
                print(f"Error enviando correo de confirmación de identidad: {e}")

        return Response(
            {
                'token': str(token_obj.token),
                'message': (
                    'Token generado. Tanto el prestador como el solicitante deben '
                    'abrir el enlace enviado a su correo.'
                ),
                'errores_envio': errores,
            },
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _identity_email_html(persona, confirm_url, rol_texto):
        """Arma el correo de confirmación de identidad para una de las dos partes."""
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif; color: #242424; }}
                .container {{ max-width: 500px; background-color: #ffffff; border-radius: 1rem; border: 2px solid #E1F2D8; margin: 20px auto; overflow: hidden; }}
                .header {{ background: linear-gradient(to right, #72277C, #163F5C); padding: 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 1px; }}
                .content {{ padding: 32px 24px; text-align: center; }}
                .btn {{ display: inline-block; margin: 24px auto; padding: 14px 32px; background-color: #39A900; color: #ffffff; text-decoration: none; border-radius: 0.75rem; font-weight: 700; font-size: 1rem; }}
                .footer {{ padding: 24px; text-align: center; border-top: 1px solid #D1D1D1; background-color: #fafafa; }}
                .footer p {{ margin: 0; font-size: 0.75rem; color: #878787; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>SIGI</h1></div>
                <div class="content">
                    <h2 style="margin-top:0; color:#007A33;">Confirmación de identidad</h2>
                    <p>Hola {persona.first_name}, se está registrando un préstamo en el que {rol_texto} los materiales.</p>
                    <p>Haz clic en el botón para confirmar que eres tú:</p>
                    <a href="{confirm_url}" class="btn">Confirmar identidad</a>
                    <p style="font-size:0.875rem; color:#878787;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>{confirm_url}</p>
                </div>
                <div class="footer">
                    <p>Si no esperabas este correo, por favor contáctanos de inmediato.</p>
                </div>
            </div>
        </body>
        </html>
        """

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
    # CONFIRM (link del correo)  GET /api/loans/confirm/{token}/{rol}/
    # Cada parte abre su propio enlace desde el correo — no requiere login.
    # El rol (lender / requester) viene en la URL para saber cuál confirmó.
    # ──────────────────────────────────────────────────────────────
    @action(
        detail=False,
        methods=['get'],
        url_path=r'confirm/(?P<token>[0-9a-f-]+)/(?P<rol>lender|requester)',
        permission_classes=[],
    )
    def confirm_identity(self, request, token=None, rol=None):
        try:
            token_obj = IdentityToken.objects.get(token=token)
        except IdentityToken.DoesNotExist:
            return Response(
                {'error': 'Token inválido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Marca solo la parte que corresponde al enlace abierto.
        # Si ya estaba confirmada se deja igual (abrir el enlace dos veces
        # no debe romper nada ni mostrar un error innecesario).
        if rol == 'lender':
            token_obj.lender_confirmed = True
            token_obj.save(update_fields=['lender_confirmed'])
        else:
            token_obj.requester_confirmed = True
            token_obj.save(update_fields=['requester_confirmed'])

        # Redirige al frontend — la página muestra "Identidad confirmada ✓"
        # Se envía si ya están ambas confirmaciones para poder mostrar
        # un mensaje distinto cuando todavía falta la otra parte.
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        pendiente = 'no' if token_obj.is_confirmed else 'si'
        return redirect(f'{frontend_url}/confirm-identity?status=ok&pendiente={pendiente}')
