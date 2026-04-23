from django.contrib import admin
from .models import Evaluation

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):# Register your models here.
