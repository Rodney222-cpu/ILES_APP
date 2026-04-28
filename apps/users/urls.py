from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, login_view
from .views import register_view

router = DefaultRouter()
router.register('users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),  
    path('login/', login_view),  
    path('register/', register_view),
     
]

