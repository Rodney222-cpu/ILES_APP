from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
User = get_user_model

class userViewSet (viewsets.ModelViewSet):
    querryset = User.objects.all
    serializer_class = UserSerializer
    permission_classes =[IsAuthenticated]