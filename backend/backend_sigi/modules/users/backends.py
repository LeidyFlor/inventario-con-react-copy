from .models import Users
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

class JWTSessionAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        # Obtiene el usuario usando user_id del token y valida si está activo (método del padre)
        user = super().get_user(validated_token)
        
        # Extrae el jti del token del token actual que envió react
        jti = str(validated_token['jti'])
        #compara el jti con el de la bd
        if user.current_token_jti != jti:
            raise InvalidToken('La sesión fue iniciada en otro dispositivo, o ya expiró')
        
        return user