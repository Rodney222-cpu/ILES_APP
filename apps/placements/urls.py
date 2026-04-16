from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InternshipPlacementViewSet

router = DefaultRouter()
router.register(r'internship', InternshipPlacementViewSet, basename = 'internship')

urlpatterns = [
    path('', include(router.urls)),
]