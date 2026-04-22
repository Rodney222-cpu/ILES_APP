from django.shortcuts import render

from rest_framework import viewsets, permissions
from .models import InternshipPlacement
from .serializers import InternshipPlacementserializer

class InternshipPlacementViewSet(viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.all()
    serializer_class = InternshipPlacementserializer
    permission_classes = [permissions.IsAuthenticated]