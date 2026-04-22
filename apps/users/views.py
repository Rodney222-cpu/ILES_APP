from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
User = get_user_model()

class UserViewSet (viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        
        user = self.request.user
        if not user or not user.is_authenticated:
            return User.objects.none()

        if user.role == 'admin':
            
            return User.objects.all()
    
        return User.objects.filter(id=user.id)
    