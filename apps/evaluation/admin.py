from django.contrib import admin
from .models import Evaluation

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):

    list_display = [ 'grade', 'created_at'] # Register your models here.

    list_display = ('internship', 'grade', 'created_at') 

