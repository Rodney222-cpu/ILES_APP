from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import InternshipEvaluation
from .serializers import InternshipEvaluationSerializer
from apps.notifications.utils import notify_evaluation_submitted


class InternshipEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "student":
            return InternshipEvaluation.objects.filter(placement__student=user)

        if user.role == "workplace_supervisor":
            return InternshipEvaluation.objects.filter(
                placement__workplace_supervisor=user
            )

        if user.role == "academic_supervisor":
            return InternshipEvaluation.objects.filter(
                placement__academic_supervisor=user
            )

        if user.role == "admin":
            return InternshipEvaluation.objects.all()

        return InternshipEvaluation.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        placement = serializer.validated_data.get("placement")

        if user.role not in ["workplace_supervisor", "academic_supervisor", "admin"]:
            raise PermissionDenied("Only supervisors or administrators can evaluate.")

        if user.role == "workplace_supervisor" and placement.workplace_supervisor != user:
            raise ValidationError("You can only evaluate your assigned students.")

        if user.role == "academic_supervisor" and placement.academic_supervisor != user:
            raise ValidationError("You can only evaluate your assigned students.")

        evaluation = serializer.save(evaluator=user)
        
        # Notify student
        notify_evaluation_submitted(evaluation)

    def perform_update(self, serializer):
        evaluation = self.get_object()
        user = self.request.user

        if user.role != "admin" and evaluation.evaluator != user:
            raise PermissionDenied("You can only update your own evaluations.")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role != "admin" and instance.evaluator != user:
            raise PermissionDenied("You can only delete your own evaluations.")

        instance.delete()
