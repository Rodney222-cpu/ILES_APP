from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import WeeklyLog
from .serializers import (
    WeeklyLogSerializer,
    WeeklyLogCreateSerializer,
    WeeklyLogUpdateSerializer,
    WeeklyLogSubmitToWorkplaceSerializer,
    WorkplaceReviewSerializer,
    WeeklyLogWorkplaceDetailSerializer,
    WeeklyLogSubmitToAcademicSerializer,
    AcademicEvaluationSerializer,
    WeeklyLogAcademicDetailSerializer,
    WeeklyLogStudentDetailSerializer
)


class WeeklyLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing weekly logs with three-stage workflow:
    1. Student creates and submits to workplace supervisor
    2. Workplace supervisor reviews and authorizes
    3. Student submits to academic supervisor
    4. Academic supervisor evaluates and awards marks
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'student':
            # Students see only their own logs
            return WeeklyLog.objects.filter(student=user).select_related(
                'student', 'placement', 'workplace_reviewed_by', 'academic_evaluated_by'
            )
        elif user.role == 'workplace':
            # Workplace supervisors see logs for their assigned placements
            return WeeklyLog.objects.filter(
                placement__workplace_supervisor=user
            ).select_related(
                'student', 'placement', 'workplace_reviewed_by'
            )
        elif user.role == 'academic':
            # Academic supervisors see logs for their assigned placements
            return WeeklyLog.objects.filter(
                placement__academic_supervisor=user
            ).select_related(
                'student', 'placement', 'workplace_reviewed_by', 'academic_evaluated_by'
            )
        else:
            # Admins see all logs
            return WeeklyLog.objects.all().select_related(
                'student', 'placement', 'workplace_reviewed_by', 'academic_evaluated_by'
            )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WeeklyLogCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WeeklyLogUpdateSerializer
        elif self.action == 'retrieve':
            user = self.request.user
            if user.role == 'student':
                return WeeklyLogStudentDetailSerializer
            elif user.role == 'workplace':
                return WeeklyLogWorkplaceDetailSerializer
            elif user.role == 'academic':
                return WeeklyLogAcademicDetailSerializer
        return WeeklyLogSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    def update(self, request, *args, **kwargs):
        """Only allow updating draft logs"""
        log = self.get_object()
        if log.status != 'DRAFT':
            return Response(
                {"error": "Only draft logs can be edited"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
    
    # ==================== STUDENT ACTIONS ====================
    
    @action(detail=True, methods=['post'], url_path='submit-to-workplace')
    def submit_to_workplace(self, request, pk=None):
        """
        Student submits log to workplace supervisor for review.
        Only available for draft logs.
        """
        log = self.get_object()
        
        # Verify the requesting user is the log owner
        if log.student != request.user:
            return Response(
                {"error": "You can only submit your own logs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = WeeklyLogSubmitToWorkplaceSerializer(
            data=request.data,
            context={'log': log, 'request': request}
        )
        
        if serializer.is_valid():
            updated_log = serializer.save()
            return Response(
                {
                    "message": "Log successfully submitted to workplace supervisor",
                    "log": WeeklyLogStudentDetailSerializer(updated_log).data
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='submit-to-academic')
    def submit_to_academic(self, request, pk=None):
        """
        Student submits authorized log to academic supervisor for evaluation.
        Only available for logs authorized by workplace supervisor.
        """
        log = self.get_object()
        
        # Verify the requesting user is the log owner
        if log.student != request.user:
            return Response(
                {"error": "You can only submit your own logs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = WeeklyLogSubmitToAcademicSerializer(
            data=request.data,
            context={'log': log, 'request': request}
        )
        
        if serializer.is_valid():
            updated_log = serializer.save()
            return Response(
                {
                    "message": "Log successfully submitted to academic supervisor",
                    "log": WeeklyLogStudentDetailSerializer(updated_log).data
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='my-logs')
    def my_logs(self, request):
        """
        Students can view all their logs grouped by status
        """
        if request.user.role != 'student':
            return Response(
                {"error": "This endpoint is only for students"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        logs = self.get_queryset()
        
        return Response({
            "drafts": WeeklyLogStudentDetailSerializer(
                logs.filter(status='DRAFT'), many=True
            ).data,
            "pending_workplace_review": WeeklyLogStudentDetailSerializer(
                logs.filter(status='PENDING_WORKPLACE_REVIEW'), many=True
            ).data,
            "authorized_for_academic": WeeklyLogStudentDetailSerializer(
                logs.filter(status='AUTHORIZED_FOR_ACADEMIC'), many=True
            ).data,
            "pending_academic_evaluation": WeeklyLogStudentDetailSerializer(
                logs.filter(status='PENDING_ACADEMIC_EVALUATION'), many=True
            ).data,
            "evaluated": WeeklyLogStudentDetailSerializer(
                logs.filter(status='EVALUATED'), many=True
            ).data
        })
    
    # ==================== WORKPLACE SUPERVISOR ACTIONS ====================
    
    @action(detail=True, methods=['post'], url_path='workplace-review')
    def workplace_review(self, request, pk=None):
        """
        Workplace supervisor reviews and authorizes a log.
        Adds remarks and changes status to authorized.
        Does NOT automatically submit to academic supervisor.
        """
        log = self.get_object()
        
        if request.user.role != 'workplace':
            return Response(
                {"error": "Only workplace supervisors can review logs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = WorkplaceReviewSerializer(
            data=request.data,
            context={'log': log, 'request': request}
        )
        
        if serializer.is_valid():
            updated_log = serializer.save()
            return Response(
                {
                    "message": "Log successfully reviewed and authorized",
                    "log": WeeklyLogWorkplaceDetailSerializer(updated_log).data
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='workplace-dashboard')
    def workplace_dashboard(self, request):
        """
        Workplace supervisor dashboard showing logs grouped by status
        """
        if request.user.role != 'workplace':
            return Response(
                {"error": "This endpoint is only for workplace supervisors"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        logs = self.get_queryset()
        
        return Response({
            "pending_review": WeeklyLogWorkplaceDetailSerializer(
                logs.filter(status='PENDING_WORKPLACE_REVIEW'), many=True
            ).data,
            "authorized": WeeklyLogWorkplaceDetailSerializer(
                logs.filter(
                    status__in=['AUTHORIZED_FOR_ACADEMIC', 'PENDING_ACADEMIC_EVALUATION', 'EVALUATED'],
                    is_authorized=True
                ),
                many=True
            ).data,
            "all_reviewed": WeeklyLogWorkplaceDetailSerializer(
                logs.exclude(status__in=['DRAFT', 'PENDING_WORKPLACE_REVIEW']),
                many=True
            ).data
        })
    
    # ==================== ACADEMIC SUPERVISOR ACTIONS ====================
    
    @action(detail=True, methods=['post'], url_path='academic-evaluate')
    def academic_evaluate(self, request, pk=None):
        """
        Academic supervisor evaluates a log and awards marks.
        Only available for logs that have been:
        1. Authorized by workplace supervisor
        2. Submitted by student
        """
        log = self.get_object()
        
        if request.user.role != 'academic':
            return Response(
                {"error": "Only academic supervisors can evaluate logs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AcademicEvaluationSerializer(
            data=request.data,
            context={'log': log, 'request': request}
        )
        
        if serializer.is_valid():
            updated_log = serializer.save()
            return Response(
                {
                    "message": "Log successfully evaluated and marks awarded",
                    "log": WeeklyLogAcademicDetailSerializer(updated_log).data
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='academic-dashboard')
    def academic_dashboard(self, request):
        """
        Academic supervisor dashboard showing logs grouped by evaluation status
        """
        if request.user.role != 'academic':
            return Response(
                {"error": "This endpoint is only for academic supervisors"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        logs = self.get_queryset()
        
        return Response({
            "awaiting_evaluation": WeeklyLogAcademicDetailSerializer(
                logs.filter(
                    status='PENDING_ACADEMIC_EVALUATION',
                    is_authorized=True
                ),
                many=True
            ).data,
            "evaluated": WeeklyLogAcademicDetailSerializer(
                logs.filter(status='EVALUATED'), many=True
            ).data
        })
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        """
        Get statistics about weekly logs for the current user
        """
        logs = self.get_queryset()
        user = request.user
        
        stats = {
            "total": logs.count(),
            "by_status": {}
        }
        
        for status_code, status_label in WeeklyLog.STATUS_CHOICES:
            count = logs.filter(status=status_code).count()
            stats["by_status"][status_code] = {
                "label": status_label,
                "count": count
            }
        
        if user.role == 'student':
            stats["can_submit_to_academic"] = logs.filter(
                status='AUTHORIZED_FOR_ACADEMIC'
            ).count()
        elif user.role == 'workplace':
            stats["pending_my_review"] = logs.filter(
                status='PENDING_WORKPLACE_REVIEW'
            ).count()
        elif user.role == 'academic':
            stats["pending_my_evaluation"] = logs.filter(
                status='PENDING_ACADEMIC_EVALUATION'
            ).count()
        
        return Response(stats)
