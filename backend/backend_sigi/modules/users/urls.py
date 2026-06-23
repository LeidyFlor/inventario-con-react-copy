from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, document_types, available_permissions
from .auth_views import ForgotPasswordView, VerifyResetCodeView, ResetPasswordView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'groups', GroupViewSet, basename='groups')

urlpatterns = [
    path('', include(router.urls)),
    path('document-types/', document_types, name='document-types'),
    path('permissions/', available_permissions, name='available-permissions'),
    # Endpoints de recuperación de contraseña (no requieren autenticación)
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/verify-code/',     VerifyResetCodeView.as_view(), name='verify-code'),
    path('auth/reset-password/',  ResetPasswordView.as_view(), name='reset-password'),
]
