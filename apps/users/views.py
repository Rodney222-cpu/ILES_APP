from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()

class UserViewSet (viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        
        user = self.request.user

        if user.is_staff or user.is_superuser:
            
            return User.objects.all()
    
        return User.objects.filter(id=user.id)
    
@api_view(['POST'])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        
        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "token": str(refresh.access_token),
                "role": user.role,
                "username": user.username
            }) 
        return Response({"error": "Invalid credentials"}, status=400)

    return Response(serializer.errors, status=400)        
            
@api_view(['POST'])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered successfully"})

    return Response(serializer.errors, status=400)
