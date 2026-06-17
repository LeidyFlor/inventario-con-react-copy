from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, ConsumableMaterialViewSet, ReturnableMaterialViewSet, inventory_managers

router = DefaultRouter()
router.register(r'brands', BrandViewSet, basename='brands')
router.register(r'consumable-materials', ConsumableMaterialViewSet, basename='consumable-materials')
router.register(r'returnable-materials', ReturnableMaterialViewSet, basename='returnable-materials')

urlpatterns = [
    path('', include(router.urls)),
    path('inventory-managers/', inventory_managers, name='inventory-managers'),
]