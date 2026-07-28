from .models import Users
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.utils import timezone
from datetime import timedelta

# Tiempo máximo sin recibir un heartbeat del frontend antes de considerar
# que la pestaña se cerró y la sesión debe darse por terminada.
# El frontend envía un heartbeat cada 2 minutos (ver features/auth en el
# frontend), así que 5 minutos da margen de sobra para una recarga lenta
# o una pérdida momentánea de red sin cerrar sesión de más.
HEARTBEAT_GRACE_PERIOD = timedelta(minutes=5)


class JWTSessionAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        # Obtiene el usuario usando user_id del token y valida si está activo (método del padre)
        user = super().get_user(validated_token)

        # Extrae el jti del token del token actual que envió react
        jti = str(validated_token['jti'])
        #compara el jti con el de la bd
        if user.current_token_jti != jti:
            raise InvalidToken('La sesión fue iniciada en otro dispositivo, o ya expiró')

        # Si pasó demasiado tiempo desde el último heartbeat, se asume que la
        # pestaña se cerró. Se limpia current_token_jti (igual que un logout
        # normal) para liberar el cupo de "una sola sesión activa" del usuario.
        if user.last_heartbeat_at and timezone.now() - user.last_heartbeat_at > HEARTBEAT_GRACE_PERIOD:
            user.current_token_jti = None
            user.current_token_expires_at = None
            user.save(update_fields=['current_token_jti', 'current_token_expires_at'])
            raise InvalidToken('La sesión se cerró por inactividad de la pestaña.')

        return user