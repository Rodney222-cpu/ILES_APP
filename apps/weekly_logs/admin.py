from django.contrib import admin
from .models import WeeklyLog

@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ('placement', 'week_number', 'submitted_at')
    list_filter = ('submitted_at',)
