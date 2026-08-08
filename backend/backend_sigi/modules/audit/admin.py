from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user_email', 'action', 'module', 'objeto')
    list_filter = ('action', 'module')
    search_fields = ('user_email', 'objeto')
    # La auditoría no se edita: solo se consulta
    readonly_fields = ('user', 'user_email', 'action', 'module', 'objeto', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
