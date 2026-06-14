from rest_framework import viewsets, serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from django.utils import timezone
from django.db import models
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
            # Workplace supervisor only sees logs from their company
            if user.company_name:
                queryset = WeeklyLogModel.objects.filter(
                    placement__workplace_supervisor=user,
                    placement__company_name__iexact=user.company_name  # Case-insensitive match
                )
            else:
                # If no company assigned, only show logs from assigned placements
                queryset = WeeklyLogModel.objects.filter(
                    placement__workplace_supervisor=user,
                )
            # Workplace supervisor sees SUBMITTED logs for review
            if not status_filter:
                queryset = queryset.filter(status='SUBMITTED')
            elif status_filter.upper() != 'ALL':
                queryset = queryset.filter(status=status_filter.upper())

        elif user.role == "academic_supervisor":
            queryset = WeeklyLogModel.objects.filter(
                placement__academic_supervisor=user,
            )
            # Academic supervisor sees PENDING_EVALUATION logs
            if not status_filter:
                queryset = queryset.filter(status='PENDING_EVALUATION')
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
        except Exception as e:
            raise ValidationError({
                "placement": "You do not have an approved placement. Please submit a placement request first and wait for admin approval."
            })
        
        # Check if placement is approved or active
        if placement.status not in ['approved', 'active']:
            if placement.status == 'pending_approval':
                raise ValidationError({
                    "placement": "Your placement request is pending admin approval. You cannot submit logs until it is approved."
                })
            elif placement.status == 'rejected':
                raise ValidationError({
                    "placement": f"Your placement request was rejected. Reason: {placement.admin_comment or 'No reason provided'}. Please contact the administrator."
                })
            else:
                raise ValidationError({
                    "placement": "You do not have an active placement. Please contact the administrator."
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
        
        # Notify supervisors (wrapped in try/except so notification failures don't break submission)
        try:
            supervisors = []
            if placement.workplace_supervisor:
                supervisors.append(placement.workplace_supervisor)
            if placement.academic_supervisor:
                supervisors.append(placement.academic_supervisor)
            
            if supervisors:
                notify_log_submitted(log, supervisors)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send log submission notification: {e}")

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
    # WORKPLACE SUPERVISOR: AUTHORIZE LOG
    # =======================
    @action(detail=True, methods=["post"])
    def authorize(self, request, pk=None):
        """Workplace supervisor authorizes log for academic submission"""
        user = request.user
        log = self.get_object()

        if user.role != "workplace_supervisor":
            raise PermissionDenied("Only workplace supervisors can authorize logs")

        if log.placement.workplace_supervisor != user:
            raise PermissionDenied("Not your assigned log")

        if log.status != "SUBMITTED":
            raise ValidationError("Only submitted logs can be authorized")

        comment = request.data.get("workplace_supervisor_comment", "").strip()

        if not comment:
            raise ValidationError({"workplace_supervisor_comment": "Comments are required for authorization"})

        # Save workplace supervisor's authorization
        log.workplace_reviewer_name = user.get_full_name() or user.username
        log.workplace_supervisor_comment = comment
        log.supervisor_comment = comment  # For backward compatibility
        log.workplace_review_date = timezone.now()
        log.status = "AUTHORIZED"
        log.save()

        # Notify student that log is authorized
        try:
            from apps.notifications.utils import create_notification
            create_notification(
                recipient=log.placement.student,
                notification_type='log_status',
                title='Log Authorized',
                message=f'Your Week {log.week_number} log has been authorized by {log.workplace_reviewer_name}. You can now submit it to your academic supervisor.',
                related_log_id=log.id
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send authorization notification: {e}")

        return Response({
            "message": "Log authorized successfully. Student can now submit to academic supervisor.",
            "status": "AUTHORIZED"
        })

    # =======================
    # STUDENT: SUBMIT TO ACADEMIC SUPERVISOR
    # =======================
    @action(detail=True, methods=["post"])
    def submit_to_academic(self, request, pk=None):
        """Student submits authorized log to academic supervisor"""
        user = request.user
        log = self.get_object()

        if user.role != "student":
            raise PermissionDenied("Only students can submit logs to academic supervisor")

        if log.placement.student != user:
            raise PermissionDenied("You can only submit your own logs")

        if log.status != "AUTHORIZED":
            raise ValidationError({
                "detail": "Log must be authorized by workplace supervisor before submitting to academic supervisor"
            })

        if not log.placement.academic_supervisor:
            raise ValidationError({
                "detail": "No academic supervisor assigned to your placement"
            })

        log.status = "PENDING_EVALUATION"
        log.save()

        # Notify academic supervisor
        try:
            from apps.notifications.utils import create_notification
            create_notification(
                recipient=log.placement.academic_supervisor,
                notification_type='log_submitted',
                title='New Log for Evaluation',
                message=f'{user.username} submitted Week {log.week_number} log for evaluation.',
                related_log_id=log.id
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send evaluation request notification: {e}")

        return Response({
            "message": "Log submitted to academic supervisor for evaluation",
            "status": "PENDING_EVALUATION"
        })

    # =======================
    # ACADEMIC SUPERVISOR: EVALUATE AND AWARD MARKS
    # =======================
    @action(detail=True, methods=["post"])
    def evaluate(self, request, pk=None):
        """Academic supervisor evaluates log and awards marks"""
        user = request.user
        log = self.get_object()

        if user.role != "academic_supervisor":
            raise PermissionDenied("Only academic supervisors can evaluate logs")

        if log.placement.academic_supervisor != user:
            raise PermissionDenied("Not your assigned log")

        if log.status != "PENDING_EVALUATION":
            raise ValidationError("Only logs pending evaluation can be evaluated")

        comment = request.data.get("academic_supervisor_comment", "").strip()
        marks = request.data.get("marks_awarded")

        if not comment:
            raise ValidationError({"academic_supervisor_comment": "Evaluation comments are required"})

        # Validate marks
        if marks is not None:
            try:
                marks = float(marks)
                if marks < 0 or marks > 100:
                    raise ValidationError({"marks_awarded": "Marks must be between 0 and 100"})
            except (ValueError, TypeError):
                raise ValidationError({"marks_awarded": "Invalid marks value"})

        # Save academic evaluation
        log.academic_evaluator_name = user.get_full_name() or user.username
        log.academic_supervisor_comment = comment
        log.marks_awarded = marks
        log.academic_evaluation_date = timezone.now()
        log.status = "EVALUATED"
        log.save()

        # Notify student
        try:
            from apps.notifications.utils import create_notification
            create_notification(
                recipient=log.placement.student,
                notification_type='log_evaluated',
                title='Log Evaluated',
                message=f'Your Week {log.week_number} log has been evaluated. Marks: {marks if marks else "N/A"}',
                related_log_id=log.id
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send evaluation notification: {e}")

        return Response({
            "message": "Log evaluated successfully",
            "status": "EVALUATED",
            "marks_awarded": marks
        })

    # =======================
    # LEGACY ENDPOINTS (BACKWARD COMPATIBILITY)
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

        # Save the workplace supervisor's name and comment on the log
        log.workplace_reviewer_name = user.get_full_name() or user.username
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
        """Legacy endpoint - redirects to appropriate new endpoint based on role"""
        user = request.user
        log = self.get_object()
        status = str(request.data.get("status", "")).upper()
        comment = str(request.data.get("supervisor_comment", "")).strip()

        if user.role == "workplace_supervisor":
            # Redirect to authorize endpoint
            if status == "AUTHORIZED" or status == "REVIEWED":
                return self.authorize(request, pk)
            
        elif user.role == "academic_supervisor":
            # Redirect to evaluate endpoint
            if status == "EVALUATED" or status == "APPROVED":
                return self.evaluate(request, pk)
            elif status == "REJECTED":
                # Handle rejection
                if not comment:
                    raise ValidationError({"supervisor_comment": "Rejection reason is required"})
                
                log.academic_evaluator_name = user.get_full_name() or user.username
                log.academic_supervisor_comment = comment
                log.academic_evaluation_date = timezone.now()
                log.status = "REJECTED"
                log.save()
                
                return Response({"message": "Log rejected", "status": "REJECTED"})
        
        elif user.role == "admin":
            # Admin can update any status
            if status in ["AUTHORIZED", "PENDING_EVALUATION", "EVALUATED", "REJECTED"]:
                if not comment:
                    raise ValidationError({"supervisor_comment": "Comment is required"})
                
                log.supervisor_comment = comment
                log.status = status
                log.save()
                
                return Response({"message": f"Log marked as {status}"})

        raise PermissionDenied("Invalid action for your role")

    # =======================
    # DASHBOARD ENDPOINTS
    # =======================
    @action(detail=False, methods=["get"], url_path="student-dashboard")
    def student_dashboard(self, request):
        """
        Student dashboard showing logs grouped by status for easy navigation
        """
        if request.user.role != "student":
            raise PermissionDenied("This endpoint is only for students")
        
        logs = self.get_queryset()
        
        return Response({
            "summary": {
                "total": logs.count(),
                "drafts": logs.filter(status='DRAFT').count(),
                "pending_workplace": logs.filter(status='SUBMITTED').count(),
                "authorized": logs.filter(status='AUTHORIZED').count(),
                "pending_evaluation": logs.filter(status='PENDING_EVALUATION').count(),
                "evaluated": logs.filter(status='EVALUATED').count(),
                "rejected": logs.filter(status='REJECTED').count()
            },
            "drafts": WeeklyLogSerializer(
                logs.filter(status='DRAFT').order_by('-week_number'), 
                many=True
            ).data,
            "pending_workplace_review": WeeklyLogSerializer(
                logs.filter(status='SUBMITTED').order_by('-submitted_at'), 
                many=True
            ).data,
            "authorized_for_academic": WeeklyLogSerializer(
                logs.filter(status='AUTHORIZED').order_by('-workplace_review_date'), 
                many=True
            ).data,
            "pending_academic_evaluation": WeeklyLogSerializer(
                logs.filter(status='PENDING_EVALUATION').order_by('-updated_at'), 
                many=True
            ).data,
            "evaluated": WeeklyLogSerializer(
                logs.filter(status='EVALUATED').order_by('-academic_evaluation_date'), 
                many=True
            ).data,
            "rejected": WeeklyLogSerializer(
                logs.filter(status='REJECTED').order_by('-updated_at'), 
                many=True
            ).data
        })
    
    @action(detail=False, methods=["get"], url_path="workplace-dashboard")
    def workplace_dashboard(self, request):
        """
        Workplace supervisor dashboard showing:
        - Pending reviews (SUBMITTED)
        - Authorized logs (AUTHORIZED, PENDING_EVALUATION, EVALUATED)
        - All reviewed logs for tracking
        """
        if request.user.role != "workplace_supervisor":
            raise PermissionDenied("This endpoint is only for workplace supervisors")
        
        logs = self.get_queryset()
        
        # Pending review
        pending_review = logs.filter(status='SUBMITTED')
        
        # Authorized logs (includes those submitted to academic and evaluated)
        authorized = logs.filter(
            status__in=['AUTHORIZED', 'PENDING_EVALUATION', 'EVALUATED']
        ).exclude(workplace_supervisor_comment__exact='')
        
        # All reviewed logs (for history/tracking)
        all_reviewed = logs.exclude(status__in=['DRAFT', 'SUBMITTED'])
        
        return Response({
            "summary": {
                "pending_review": pending_review.count(),
                "authorized": authorized.count(),
                "total_reviewed": all_reviewed.count()
            },
            "pending_review": WeeklyLogSerializer(
                pending_review.order_by('submitted_at'), 
                many=True
            ).data,
            "authorized": WeeklyLogSerializer(
                authorized.order_by('-workplace_review_date'), 
                many=True
            ).data,
            "all_reviewed": WeeklyLogSerializer(
                all_reviewed.order_by('-workplace_review_date'), 
                many=True
            ).data
        })
    
    @action(detail=False, methods=["get"], url_path="academic-dashboard")
    def academic_dashboard(self, request):
        """
        Academic supervisor dashboard showing:
        - Awaiting evaluation (PENDING_EVALUATION)
        - Evaluated logs (EVALUATED) - permanent record
        """
        if request.user.role != "academic_supervisor":
            raise PermissionDenied("This endpoint is only for academic supervisors")
        
        logs = self.get_queryset()
        
        # Logs awaiting evaluation
        awaiting_evaluation = logs.filter(
            status='PENDING_EVALUATION'
        ).exclude(workplace_supervisor_comment__exact='')
        
        # Evaluated logs (permanent record)
        evaluated = logs.filter(status='EVALUATED')
        
        return Response({
            "summary": {
                "awaiting_evaluation": awaiting_evaluation.count(),
                "evaluated": evaluated.count(),
                "average_marks": evaluated.aggregate(
                    avg_marks=models.Avg('marks_awarded')
                )['avg_marks'] or 0
            },
            "awaiting_evaluation": WeeklyLogSerializer(
                awaiting_evaluation.order_by('updated_at'), 
                many=True
            ).data,
            "evaluated": WeeklyLogSerializer(
                evaluated.order_by('-academic_evaluation_date'), 
                many=True
            ).data
        })
    
    @action(detail=False, methods=["get"], url_path="workflow-stats")
    def workflow_stats(self, request):
        """
        Get detailed workflow statistics for the current user
        """
        logs = self.get_queryset()
        user = request.user
        
        stats = {
            "total_logs": logs.count(),
            "by_status": {}
        }
        
        # Count by status
        for status_code, status_label in WeeklyLogModel.STATUS_CHOICES:
            count = logs.filter(status=status_code).count()
            stats["by_status"][status_code] = {
                "label": status_label,
                "count": count
            }
        
        # Role-specific stats
        if user.role == "student":
            stats["actionable"] = {
                "can_submit_to_workplace": logs.filter(status='DRAFT').count(),
                "can_submit_to_academic": logs.filter(status='AUTHORIZED').count()
            }
            stats["in_progress"] = logs.filter(
                status__in=['SUBMITTED', 'PENDING_EVALUATION']
            ).count()
            stats["completed"] = logs.filter(status='EVALUATED').count()
            
        elif user.role == "workplace_supervisor":
            stats["actionable"] = {
                "pending_my_review": logs.filter(status='SUBMITTED').count()
            }
            stats["reviewed"] = logs.exclude(
                status__in=['DRAFT', 'SUBMITTED']
            ).exclude(workplace_supervisor_comment__exact='').count()
            
        elif user.role == "academic_supervisor":
            stats["actionable"] = {
                "pending_my_evaluation": logs.filter(status='PENDING_EVALUATION').count()
            }
            stats["evaluated"] = logs.filter(status='EVALUATED').count()
            if stats["evaluated"] > 0:
                stats["average_marks"] = logs.filter(
                    status='EVALUATED'
                ).aggregate(
                    avg=models.Avg('marks_awarded')
                )['avg'] or 0
        
        return Response(stats)