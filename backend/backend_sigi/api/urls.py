from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from backend_sigi.modules.users.auth_views import LoginView
from backend_sigi.utils.audit_views import download_audit_log
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend_sigi.modules.users.urls')),
    path('api/', include('backend_sigi.modules.materials.urls')),
    path('api/', include('backend_sigi.modules.loans.urls')),
    path('api/', include('backend_sigi.modules.tasks.urls')),
    path('api/', include('backend_sigi.modules.inventory_name.urls')),
    path('api/', include('backend_sigi.modules.category.urls')),
    path('api/', include('backend_sigi.modules.quotation.urls')),
    path('api/auth/login', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/audit/download/', download_audit_log, name='audit_download'),
]
