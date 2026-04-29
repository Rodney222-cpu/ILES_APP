from django.shortcuts import render

from rest_framework import viewsets, permissions
from .models import InternshipPlacement
from .serializers import InternshipPlacementserializer

class InternshipPlacementViewSet(viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.all()
    serializer_class = InternshipPlacementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return InternshipPlacement.objects.all()
        return InternshipPlacement.objects.filter(student = user)