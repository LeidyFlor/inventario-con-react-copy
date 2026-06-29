from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from backend_sigi.modules.users.auth_views import LoginView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend_sigi.modules.users.urls')),
    path('api/', include('backend_sigi.modules.materials.urls')),
    path('api/', include('backend_sigi.modules.loans.urls')),
    path('api/auth/login', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),#renueva el accestoken cuando expira
]
