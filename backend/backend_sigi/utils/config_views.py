"""
Correo de soporte del sistema.

GET /api/config/support-email/   → lo lee cualquiera, incluso sin sesión
PUT /api/config/support-email/   → solo el superadministrador

El GET es público a propósito: el dato se muestra en el pie del login, donde
todavía no hay token. No revela nada sensible — es un correo de contacto que
está pensado justamente para que la gente lo vea.
"""
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from backend_sigi.modules.configuration.models import SystemConfig
from backend_sigi.utils.audit import log_action


class SupportEmailSerializer(serializers.ModelSerializer):
    # El mensaje se sobrescribe porque el de DRF viene en inglés: el proyecto
    # tiene LANGUAGE_CODE = 'en-us'. Es el mismo texto que usa forgot-password,
    # para que el usuario lea siempre lo mismo ante el mismo problema.
    support_email = serializers.EmailField(
        error_messages={
            'invalid': 'El correo electrónico no tiene un formato válido.',
            'blank': 'El correo de soporte es obligatorio.',
        }
    )

    class Meta:
        model = SystemConfig
        fields = ['support_email']


class SupportEmailView(APIView):
    # AllowAny cubre el GET. El PUT hace sus propias comprobaciones abajo, en
    # vez de declararse con permission_classes, porque los dos métodos viven en
    # la misma vista y tienen reglas distintas.
    permission_classes = [AllowAny]

    def get(self, request):
        config = SystemConfig.obtener()
        return Response({'support_email': config.support_email})

    def put(self, request):
        # Sin sesión es 401, no 403: el problema no es que le falten permisos,
        # es que no sabemos quién es.
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Debes iniciar sesión para cambiar el correo de soporte.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo el superadministrador puede cambiar el correo de soporte.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        config = SystemConfig.obtener()
        serializer = SupportEmailSerializer(config, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(updated_by=request.user)

        # Queda el registro, aunque hoy no se vea: log_action no guarda nada del
        # superadministrador, y por ahora solo él puede llegar hasta aquí. Se
        # deja puesto para cuando esto pase a controlarse por permisos.
        log_action(request.user, "EDITAR", "Correo de soporte", config.support_email)

        return Response({'support_email': config.support_email})
