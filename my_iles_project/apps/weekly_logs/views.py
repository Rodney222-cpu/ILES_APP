from rest_framework import viewsets, serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.response import Response

from .models import WeeklyLogModel
from .serializers import WeeklyLogSerializer


class WeeklyLogView(viewsets.ModelViewSet):
    serializer_class = WeeklyLogSerializer

    # =======================
    # QUERYSET (OWNERSHIP)
    # =======================
    def get_queryset(self):
        user = self.request.user

        if user.role == "student":
            return WeeklyLogModel.objects.filter(placement__student=user)

        if user.role == "workplace_supervisor":
            return WeeklyLogModel.objects.filter(
                placement__workplace_supervisor=user,
                status="SUBMITTED"
            )

        if user.role == "academic_supervisor":
            return WeeklyLogModel.objects.filter(
                placement__academic_supervisor=user,
                status__in=["SUBMITTED", "REVIEWED"]
            )

        return WeeklyLogModel.objects.none()

    # =======================
    # CREATE
    # =======================
    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "student":
            raise PermissionDenied("Only students can create logs")

        serializer.save(status="DRAFT")

    # =======================
    # UPDATE (EDIT DRAFT)
    # =======================
    def perform_update(self, serializer):
        user = self.request.user
        log = self.get_object()

        if user.role != "student":
            raise PermissionDenied("Only students can edit logs")

        if log.placement.student != user:
            raise PermissionDenied("You can only edit your own logs")

        if log.status != "DRAFT":
            raise ValidationError("Only draft logs can be edited")

        allowed_fields = ['activities', 'challenges', 'learning']

        for field in list(serializer.validated_data.keys()):
            if field not in allowed_fields:
                serializer.validated_data.pop(field)

        serializer.save()

    # =======================
    # SUBMIT
    # =======================
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        user = request.user
        log = self.get_object()

        if user.role != "student":
            raise PermissionDenied("Only students can submit logs")

        if log.placement.student != user:
            raise PermissionDenied("You can only submit your own log")

        if log.status != "DRAFT":
            raise ValidationError("Only draft logs can be submitted")

        log.status = "SUBMITTED"
        log.submitted_at = timezone.now()
        log.save()

        return Response({"message": "Log submitted successfully"})

    # =======================
    # WORKPLACE REVIEW
    # =======================
    @action(detail=True, methods=["post"])
    def workplace_review(self, request, pk=None):
        user = request.user
        log = self.get_object()

        if user.role != "workplace_supervisor":
            raise PermissionDenied("Only workplace supervisors can review")

        if log.placement.workplace_supervisor != user:
            raise PermissionDenied("Not your assigned log")

        if log.status != "SUBMITTED":
            raise ValidationError("Only submitted logs can be reviewed")

        comment = request.data.get("supervisor_comment", "").strip()

        if not comment:
            raise ValidationError("Comment is required")

        log.supervisor_comment = comment
        log.status = "REVIEWED"
        log.save()

        return Response({"message": "Workplace review successful"})

    # =======================
    # ACADEMIC APPROVAL
    # =======================
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        user = request.user
        log = self.get_object()

        if user.role != "academic_supervisor":
            raise PermissionDenied("Only academic supervisors can approve")

        if log.placement.academic_supervisor != user:
            raise PermissionDenied("Not your assigned log")

        if log.status != "REVIEWED":
            raise ValidationError("Only reviewed logs can be approved")

        log.status = "APPROVED"
        log.save()

        return Response({"message": "Log approved successfully"})