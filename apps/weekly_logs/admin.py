from django.contrib import admin
from .models import WeeklyLog

@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):# Register your models here.
