from django.contrib import admin

from .models import InventoryName


@admin.register(InventoryName)
class InventoryNameAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
