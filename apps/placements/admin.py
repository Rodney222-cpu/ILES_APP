from django.contrib import admin
from .models import placements

@admin.register(placements)
class PlacementAdmin(admin.ModelAdmin):# Register your models here.
