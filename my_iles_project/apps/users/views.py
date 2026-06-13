from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer, LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import connection
from django.contrib.auth.hashers import make_password

User = get_user_model()


class RegisterView(APIView):

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User Created Successfully"},
                status=201
            )

        return Response(serializer.errors, status=400)


class LoginView(APIView):

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "role": user.role
            })

        return Response(serializer.errors, status=400)


class ResetAdminPasswordView(APIView):
    """
    ONE-TIME utility endpoint to reset the admin password on Render.
    Visit: https://iles-api.onrender.com/users/reset-admin-password/
    After use, remove or restrict this endpoint in production.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        hashed = make_password('Admin@12345')
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE users_customuser SET password=%s, is_staff=true, is_superuser=true WHERE username=%s",
                [hashed, 'admin_iles']
            )
        return Response({
            "message": "Admin password reset successfully!",
            "username": "admin_iles",
            "password": "Admin@12345",
            "admin_url": "https://iles-api.onrender.com/admin/"
        })