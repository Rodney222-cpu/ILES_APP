from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
import threading

from .models import InternshipPlacement
from .serializers import InternshipPlacementSerializer
from apps.notifications.utils import (
    notify_placement_submitted,
    notify_placement_approved,
    notify_placement_rejected,
    notify_supervisor_assigned
)
from apps.notifications.emails import (
    send_placement_approved_email,
    send_placement_rejected_email,
    send_supervisor_assigned_email
)

User = get_user_model()


class InternshipPlacementViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipPlacementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "student":
            return InternshipPlacement.objects.filter(student=user)

        if user.role == "workplace_supervisor":
            return InternshipPlacement.objects.filter(workplace_supervisor=user)

        if user.role == "academic_supervisor":
            return InternshipPlacement.objects.filter(academic_supervisor=user)

        if user.role == "admin":
            return InternshipPlacement.objects.all().select_related(
                'student', 'workplace_supervisor', 'academic_supervisor', 'approved_by'
            )

        return InternshipPlacement.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        # Only students can create placement requests
        if user.role != "student":
            raise PermissionDenied("Only students can submit placement requests.")
        
        # Check if student already has a placement
        if InternshipPlacement.objects.filter(student=user).exists():
            raise ValidationError("You already have a placement request.")
        
        placement = serializer.save(student=user, status='pending_approval')
        
        # Notify all admins
        admin_users = User.objects.filter(role='admin')
        notify_placement_submitted(placement, admin_users)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        
        # Students can only update their own pending placements
        if user.role == "student":
            if instance.student != user:
                raise PermissionDenied("You can only update your own placement.")
            if instance.status != 'pending_approval':
                raise PermissionDenied("You can only update pending placements.")
        
        # Admins can update any placement
        elif user.role != "admin":
            raise PermissionDenied("Only students or administrators can update placements.")
        
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only admin or student (if pending) can delete
        if user.role == "admin":
            instance.delete()
        elif user.role == "student" and instance.student == user and instance.status == 'pending_approval':
            instance.delete()
        else:
            raise PermissionDenied("You cannot delete this placement.")

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Admin approves a placement request"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can approve placements.")
        
        placement = self.get_object()
        
        if placement.status != 'pending_approval':
            raise ValidationError("Only pending placements can be approved.")
        
        placement.status = 'approved'
        placement.approved_by = request.user
        placement.approved_at = timezone.now()
        placement.admin_comment = request.data.get('admin_comment', '')
        placement.save()
        
        # Notify student (in-app notification immediately)
        notify_placement_approved(placement)
        
        # Send email asynchronously to avoid blocking
        threading.Thread(target=send_placement_approved_email, args=(placement,)).start()
        
        serializer = self.get_serializer(placement)
        return Response({
            'message': 'Placement approved successfully',
            'placement': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Admin rejects a placement request"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can reject placements.")
        
        placement = self.get_object()
        
        if placement.status != 'pending_approval':
            raise ValidationError("Only pending placements can be rejected.")
        
        admin_comment = request.data.get('admin_comment', '').strip()
        if not admin_comment:
            raise ValidationError({'admin_comment': 'Please provide a reason for rejection.'})
        
        placement.status = 'rejected'
        placement.approved_by = request.user
        placement.approved_at = timezone.now()
        placement.admin_comment = admin_comment
        placement.save()
        
        # Notify student (in-app notification immediately)
        notify_placement_rejected(placement)
        
        # Send email asynchronously to avoid blocking
        threading.Thread(target=send_placement_rejected_email, args=(placement,)).start()
        
        serializer = self.get_serializer(placement)
        return Response({
            'message': 'Placement rejected',
            'placement': serializer.data
        })

    @action(detail=True, methods=['post'])
    def assign_supervisor(self, request, pk=None):
        """Admin assigns academic supervisor to approved placement"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can assign supervisors.")
        
        placement = self.get_object()
        
        if placement.status not in ['approved', 'active']:
            raise ValidationError("Can only assign supervisors to approved placements.")
        
        academic_supervisor_id = request.data.get('academic_supervisor_id')
        
        if not academic_supervisor_id:
            raise ValidationError({'academic_supervisor_id': 'This field is required.'})
        
        try:
            supervisor = User.objects.get(id=academic_supervisor_id, role='academic_supervisor')
        except User.DoesNotExist:
            raise ValidationError({'academic_supervisor_id': 'Invalid academic supervisor.'})
        
        placement.academic_supervisor = supervisor
        placement.status = 'active'
        placement.save()
        
        # Notify both student and supervisor (in-app notification immediately)
        notify_supervisor_assigned(placement)
        
        # Send email asynchronously to avoid blocking
        threading.Thread(target=send_supervisor_assigned_email, args=(placement,)).start()
        
        serializer = self.get_serializer(placement)
        return Response({
            'message': 'Academic supervisor assigned successfully',
            'placement': serializer.data
        })

    @action(detail=True, methods=['post'])
    def assign_workplace_supervisor(self, request, pk=None):
        """Admin assigns workplace supervisor to approved placement"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can assign workplace supervisors.")
        
        placement = self.get_object()
        
        if placement.status not in ['approved', 'active']:
            raise ValidationError("Can only assign workplace supervisors to approved placements.")
        
        workplace_supervisor_id = request.data.get('workplace_supervisor_id')
        
        if not workplace_supervisor_id:
            raise ValidationError({'workplace_supervisor_id': 'This field is required.'})
        
        try:
            supervisor = User.objects.get(id=workplace_supervisor_id, role='workplace_supervisor')
        except User.DoesNotExist:
            raise ValidationError({'workplace_supervisor_id': 'Invalid workplace supervisor.'})
        
        placement.workplace_supervisor = supervisor
        if not placement.academic_supervisor:
            pass  # Don't change status yet, wait for academic supervisor
        else:
            placement.status = 'active'
        placement.save()
        
        serializer = self.get_serializer(placement)
        return Response({
            'message': 'Workplace supervisor assigned successfully',
            'placement': serializer.data
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending placement requests (admin only)"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can view pending placements.")
        
        pending_placements = InternshipPlacement.objects.filter(
            status='pending_approval'
        ).select_related('student')
        
        serializer = self.get_serializer(pending_placements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def supervisors(self, request):
        """Get list of available academic supervisors (admin only)"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can view supervisors.")
        
        supervisors = User.objects.filter(role='academic_supervisor').values('id', 'username', 'staff_number', 'department')
        return Response(list(supervisors))

    @action(detail=False, methods=['get'])
    def workplace_supervisors(self, request):
        """Get list of available workplace supervisors (admin or student creating placement)"""
        if request.user.role not in ['admin', 'student']:
            raise PermissionDenied("Only administrators and students can view workplace supervisors.")
        
        supervisors = User.objects.filter(role='workplace_supervisor').values('id', 'username', 'staff_number', 'department')
        return Response(list(supervisors))

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active placements (admin only)"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can view active placements.")
        
        active_placements = InternshipPlacement.objects.filter(
            status='active'
        ).select_related('student', 'academic_supervisor', 'workplace_supervisor')
        
        serializer = self.get_serializer(active_placements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Get all completed placements (admin only)"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can view completed placements.")
        
        completed_placements = InternshipPlacement.objects.filter(
            status='completed'
        ).select_related('student', 'academic_supervisor', 'workplace_supervisor')
        
        serializer = self.get_serializer(completed_placements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get placement statistics (admin only)"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can view stats.")
        
        from django.db.models import Count
        stats = InternshipPlacement.objects.values('status').annotate(count=Count('id'))
        
        # Convert to a cleaner format
        stats_dict = {item['status']: item['count'] for item in stats}
        
        return Response({
            'pending_approval': stats_dict.get('pending_approval', 0),
            'approved': stats_dict.get('approved', 0),
            'active': stats_dict.get('active', 0),
            'completed': stats_dict.get('completed', 0),
            'rejected': stats_dict.get('rejected', 0),
            'total': sum(stats_dict.values()),
        })

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Admin marks an active placement as completed"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only administrators can mark placements as completed.")
        
        placement = self.get_object()
        
        if placement.status != 'active':
            raise ValidationError("Only active placements can be marked as completed.")
        
        placement.status = 'completed'
        placement.save()
        
        # Notify student
        from apps.notifications.utils import create_notification
        create_notification(
            recipient=placement.student,
            notification_type='supervisor_assigned',
            title='Internship Completed',
            message=f'Your internship at {placement.company_name} has been marked as completed.',
            related_placement_id=placement.id
        )
        
        serializer = self.get_serializer(placement)
        return Response({
            'message': 'Placement marked as completed',
            'placement': serializer.data
        })
