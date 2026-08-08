from django.contrib import admin

from .models import Quotation


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'uploaded_at')
    search_fields = ('file_name',)
    readonly_fields = ('uploaded_at',)
