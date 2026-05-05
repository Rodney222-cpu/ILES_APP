from rest_framework.routers import DefaultRouter
from .views import EvaluationViewSet
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),  # THIS handles "/"
]

router = DefaultRouter()
router.register(r'', EvaluationViewSet)

urlpatterns = router.urls