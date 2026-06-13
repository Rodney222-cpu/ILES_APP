from django.urls import path
from .views import RegisterView, LoginView, ResetAdminPasswordView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('reset-admin-password/', ResetAdminPasswordView.as_view(), name='reset_admin_password')
]
