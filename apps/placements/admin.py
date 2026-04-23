from django.contrib import admin
from .models import InternshipPlacement

@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display = ('student', 'company_name', 'status', 'start_date')
    list_filter = ('status', 'company_name')
    search_fields = ('student__username', 'company_name')# Register your models here.
