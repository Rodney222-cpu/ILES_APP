from django.urls import path
from . import views

urlpatterns = [
    path('', views.evaluation_list, name='evaluation_list'),
    path('create/', views.create_evaluation, name='create_evaluation'),
    path('update/<int:pk>/', views.update_evaluation, name = 'update_evaluation'),
    path('delete/<int:pk>/', views.delete_evaluation, name = 'delete_evaluation'),
]