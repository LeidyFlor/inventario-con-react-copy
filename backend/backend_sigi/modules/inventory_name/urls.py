from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import InventoryNameViewSet

router = DefaultRouter()
router.register(r'inventory-names', InventoryNameViewSet, basename='inventory-names')

urlpatterns = [
    path('', include(router.urls)),
]
