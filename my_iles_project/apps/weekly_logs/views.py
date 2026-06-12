from rest_framework import viewsets, serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import WeeklyLogModel
from .serializers import WeeklyLogSerializer
from apps.notifications.utils import (
    notify_log_submitted,
    notify_log_reviewed,
    notify_log_approved,
    notify_log_rejected
)


class WeeklyLogView(viewsets.ModelViewSet):
    serializer_class = WeeklyLogSerializer
    permission_classes = [IsAuthenticated]

    # =======================
    # QUERYSET (OWNERSHIP)
    # =======================
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get("status")

        if user.role == "student":
            queryset = WeeklyLogModel.objects.filter(placement__student=user)

        elif user.role == "workplace_supervisor":
            queryset = WeeklyLogModel.objects.filter(
                placement__workplace_supervisor=user,
            )
            # Workplace supervisor only sees SUBMITTED logs (for review, not evaluation)
            if not status_filter:
                queryset = queryset.filter(status='SUBMITTED')
            elif status_filter.upper() != 'ALL':
                queryset = queryset.filter(status=status_filter.upper())

        elif user.role == "academic_supervisor":
            queryset = WeeklyLogModel.objects.filter(
                placement__academic_supervisor=user,
            )
            # Academic supervisor only sees REVIEWED logs (reviewed by workplace supervisor first)
            if not status_filter:
                queryset = queryset.filter(status='REVIEWED')
            elif status_filter.upper() != 'ALL':
                queryset = queryset.filter(status=status_filter.upper())

        elif user.role == "admin":
            queryset = WeeklyLogModel.objects.all()
        else:
            queryset = WeeklyLogModel.objects.none()

        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        return queryset.select_related("placement", "placement__student")

    # =======================
    # CREATE
    # =======================
    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "student":
            raise PermissionDenied("Only students can create logs")

        # Automatically get the student's placement
        try:
            placement = user.placement_as_student
        except Exception:
            raise ValidationError({
                "detail": "You do not have an approved placement. Please submit a placement request first and wait for admin approval."
            })
        
        # Check if placement is approved or active
        if placement.status not in ['approved', 'active']:
            if placement.status == 'pending_approval':
                raise ValidationError({
                    "detail": "Your placement request is pending admin approval. You cannot submit logs until it is approved."
                })
            elif placement.status == 'rejected':
                raise ValidationError({
                    "detail": f"Your placement request was rejected. Reason: {placement.admin_comment or 'No reason provided'}. Please contact the administrator."
                })
            else:
                raise ValidationError({
                    "detail": "You do not have an active placement. Please contact the administrator."
                })

        # Auto-set log_date to today
        from datetime import date, timedelta
        log_date = date.today()
        
        # Auto-calculate deadline (7 days from today)
        deadline = log_date + timedelta(days=7)

        log = serializer.save(
            status="SUBMITTED",  # Changed from DRAFT to SUBMITTED
            placement=placement, 
            log_date=log_date,
            deadline=deadline
        )
        
        # Notify supervisors
        supervisors = []
        if placement.workplace_supervisor:
            supervisors.append(placement.workplace_supervisor)
        if placement.academic_supervisor:
            supervisors.append(placement.academic_supervisor)
        
        if supervisors:
            notify_log_submitted(log, supervisors)

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

        allowed_fields = ['log_date', 'description', 'hours_spent', 'attachment', 'activities', 'challenges', 'learning']

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

        # Check if submission is before deadline
        from datetime import date
        today = date.today()
        
        if log.deadline and today > log.deadline:
            raise ValidationError(f"Cannot submit. Deadline was {log.deadline}. Please contact your supervisor.")

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

    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        user = request.user
        log = self.get_object()
        status = str(request.data.get("status", "")).upper()
        comment = str(request.data.get("supervisor_comment", "")).strip()

        if user.role not in ["workplace_supervisor", "academic_supervisor", "admin"]:
            raise PermissionDenied("Only supervisors/coordinators can review logs")

        if user.role == "workplace_supervisor" and log.placement.workplace_supervisor != user:
            raise PermissionDenied("Not your assigned log")

        if user.role == "academic_supervisor" and log.placement.academic_supervisor != user:
            raise PermissionDenied("Not your assigned log")

        if status not in ["APPROVED", "REJECTED", "REVIEWED"]:
            raise ValidationError({"status": "Status must be APPROVED, REJECTED, or REVIEWED"})

        if not comment:
            raise ValidationError({"supervisor_comment": "Feedback is required"})

        log.supervisor_comment = comment
        log.status = status
        log.save()
        
        # Send notifications based on status
        if status == "REVIEWED":
            notify_log_reviewed(log)
        elif status == "APPROVED":
            notify_log_approved(log)
        elif status == "REJECTED":
            notify_log_rejected(log)

        return Response({"message": f"Log marked as {status}"})