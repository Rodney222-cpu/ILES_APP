from rest_framework import serializers
from .models import WeeklyLog
from apps.users.models import CustomUser
from django.utils import timezone


class StudentBasicSerializer(serializers.ModelSerializer):
    """Basic student information"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'full_name', 'student_number']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class SupervisorBasicSerializer(serializers.ModelSerializer):
    """Basic supervisor information"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'full_name', 'staff_number']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class WeeklyLogSerializer(serializers.ModelSerializer):
    """Base serializer for weekly logs"""
    student_info = StudentBasicSerializer(source='student', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_submit_to_workplace = serializers.BooleanField(read_only=True)
    can_submit_to_academic = serializers.BooleanField(read_only=True)
    can_workplace_review = serializers.BooleanField(read_only=True)
    can_academic_evaluate = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'student', 'student_info', 'placement', 'status', 'status_display',
            'week_number', 'hours_spent', 'activities', 'description',
            'challenges', 'learning', 'deadline', 'created_at', 'updated_at',
            'can_submit_to_workplace', 'can_submit_to_academic',
            'can_workplace_review', 'can_academic_evaluate'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WeeklyLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating weekly logs"""
    
    class Meta:
        model = WeeklyLog
        fields = [
            'placement', 'week_number', 'hours_spent', 'activities',
            'description', 'challenges', 'learning', 'deadline'
        ]
    
    def create(self, validated_data):
        # Set student from request user
        validated_data['student'] = self.context['request'].user
        validated_data['status'] = 'DRAFT'
        return super().create(validated_data)


class WeeklyLogUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating draft logs"""
    
    class Meta:
        model = WeeklyLog
        fields = [
            'week_number', 'hours_spent', 'activities', 'description',
            'challenges', 'learning', 'deadline'
        ]
    
    def validate(self, data):
        if self.instance.status != 'DRAFT':
            raise serializers.ValidationError(
                "Only draft logs can be edited"
            )
        return data


class WeeklyLogSubmitToWorkplaceSerializer(serializers.Serializer):
    """Serializer for student submitting log to workplace supervisor"""
    
    def validate(self, data):
        log = self.context['log']
        if log.status != 'DRAFT':
            raise serializers.ValidationError(
                "Only draft logs can be submitted to workplace supervisor"
            )
        return data
    
    def save(self):
        log = self.context['log']
        log.status = 'PENDING_WORKPLACE_REVIEW'
        log.submitted_to_workplace_at = timezone.now()
        log.save()
        return log


class WorkplaceReviewSerializer(serializers.Serializer):
    """Serializer for workplace supervisor reviewing and authorizing logs"""
    workplace_remarks = serializers.CharField(
        required=True,
        help_text="Workplace supervisor's remarks on the log"
    )
    authorize = serializers.BooleanField(
        default=True,
        help_text="Authorize this log for academic submission"
    )
    
    def validate(self, data):
        log = self.context['log']
        user = self.context['request'].user
        
        if log.status != 'PENDING_WORKPLACE_REVIEW':
            raise serializers.ValidationError(
                "This log is not pending workplace review"
            )
        
        # Verify the user is the assigned workplace supervisor
        if log.placement.workplace_supervisor != user:
            raise serializers.ValidationError(
                "You are not the assigned workplace supervisor for this placement"
            )
        
        return data
    
    def save(self):
        log = self.context['log']
        user = self.context['request'].user
        
        log.workplace_remarks = self.validated_data['workplace_remarks']
        log.workplace_reviewed_by = user
        log.workplace_review_date = timezone.now()
        log.is_authorized = self.validated_data['authorize']
        
        if log.is_authorized:
            log.status = 'AUTHORIZED_FOR_ACADEMIC'
        
        log.save()
        return log


class WeeklyLogWorkplaceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for workplace supervisor viewing logs"""
    student_info = StudentBasicSerializer(source='student', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    workplace_reviewer_info = SupervisorBasicSerializer(
        source='workplace_reviewed_by', 
        read_only=True
    )
    
    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'student_info', 'placement', 'status', 'status_display',
            'week_number', 'hours_spent', 'activities', 'description',
            'challenges', 'learning', 'submitted_to_workplace_at',
            'workplace_remarks', 'workplace_reviewer_info',
            'workplace_review_date', 'is_authorized', 'deadline',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id']


class WeeklyLogSubmitToAcademicSerializer(serializers.Serializer):
    """Serializer for student submitting authorized log to academic supervisor"""
    
    def validate(self, data):
        log = self.context['log']
        
        if log.status != 'AUTHORIZED_FOR_ACADEMIC':
            raise serializers.ValidationError(
                "Log must be authorized by workplace supervisor before academic submission"
            )
        
        if not log.is_authorized:
            raise serializers.ValidationError(
                "Log has not been authorized by workplace supervisor"
            )
        
        return data
    
    def save(self):
        log = self.context['log']
        log.status = 'PENDING_ACADEMIC_EVALUATION'
        log.submitted_to_academic_at = timezone.now()
        log.save()
        return log


class AcademicEvaluationSerializer(serializers.Serializer):
    """Serializer for academic supervisor evaluating logs"""
    academic_comments = serializers.CharField(
        required=True,
        help_text="Academic supervisor's evaluation comments"
    )
    marks_awarded = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=True,
        help_text="Marks/grade awarded for this weekly log"
    )
    
    def validate(self, data):
        log = self.context['log']
        user = self.context['request'].user
        
        if log.status != 'PENDING_ACADEMIC_EVALUATION':
            raise serializers.ValidationError(
                "This log is not pending academic evaluation"
            )
        
        if not log.is_authorized:
            raise serializers.ValidationError(
                "Log must be authorized by workplace supervisor"
            )
        
        # Verify the user is the assigned academic supervisor
        if log.placement.academic_supervisor != user:
            raise serializers.ValidationError(
                "You are not the assigned academic supervisor for this placement"
            )
        
        return data
    
    def save(self):
        log = self.context['log']
        user = self.context['request'].user
        
        log.academic_comments = self.validated_data['academic_comments']
        log.marks_awarded = self.validated_data['marks_awarded']
        log.academic_evaluated_by = user
        log.evaluation_date = timezone.now()
        log.status = 'EVALUATED'
        
        log.save()
        return log


class WeeklyLogAcademicDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for academic supervisor viewing logs"""
    student_info = StudentBasicSerializer(source='student', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    workplace_reviewer_info = SupervisorBasicSerializer(
        source='workplace_reviewed_by',
        read_only=True
    )
    academic_evaluator_info = SupervisorBasicSerializer(
        source='academic_evaluated_by',
        read_only=True
    )
    
    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'student_info', 'placement', 'status', 'status_display',
            'week_number', 'hours_spent', 'activities', 'description',
            'challenges', 'learning', 'submitted_to_workplace_at',
            'workplace_remarks', 'workplace_reviewer_info',
            'workplace_review_date', 'is_authorized',
            'submitted_to_academic_at', 'academic_comments',
            'marks_awarded', 'academic_evaluator_info', 'evaluation_date',
            'deadline', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id']


class WeeklyLogStudentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for students viewing their own logs"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    workplace_reviewer_info = SupervisorBasicSerializer(
        source='workplace_reviewed_by',
        read_only=True
    )
    academic_evaluator_info = SupervisorBasicSerializer(
        source='academic_evaluated_by',
        read_only=True
    )
    can_submit_to_workplace = serializers.BooleanField(read_only=True)
    can_submit_to_academic = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'placement', 'status', 'status_display',
            'week_number', 'hours_spent', 'activities', 'description',
            'challenges', 'learning', 'submitted_to_workplace_at',
            'workplace_remarks', 'workplace_reviewer_info',
            'workplace_review_date', 'is_authorized',
            'submitted_to_academic_at', 'academic_comments',
            'marks_awarded', 'academic_evaluator_info', 'evaluation_date',
            'deadline', 'created_at', 'updated_at',
            'can_submit_to_workplace', 'can_submit_to_academic'
        ]
        read_only_fields = ['id']