from rest_framework import serializers
from .models import WeeklyLogModel

class WeeklyLogSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(
        source="placement.student.username",
        read_only=True
    )
    student_full_name = serializers.CharField(
        source="placement.student.get_full_name",
        read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )
    
    # Workflow state properties
    can_submit_to_workplace = serializers.BooleanField(read_only=True)
    can_submit_to_academic = serializers.BooleanField(read_only=True)
    can_workplace_review = serializers.BooleanField(read_only=True)
    can_academic_evaluate = serializers.BooleanField(read_only=True)
    workflow_stage = serializers.IntegerField(read_only=True)
    is_complete = serializers.BooleanField(read_only=True)

    def validate_hours_spent(self, value):
        if value is None:
            return value
        if value <= 0:
            raise serializers.ValidationError("Hours must be greater than zero.")
        if value > 60:
            raise serializers.ValidationError("Hours cannot exceed 60 in one week.")
        return value

    def validate(self, attrs):
        placement = attrs.get("placement")
        log_date = attrs.get("log_date")

        if self.instance:
            placement = placement or self.instance.placement
            log_date = log_date or self.instance.log_date

        # Prevent duplicate log per placement/date.
        if placement and log_date:
            duplicate_qs = WeeklyLogModel.objects.filter(
                placement=placement,
                log_date=log_date,
            )
            if self.instance:
                duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)
            if duplicate_qs.exists():
                raise serializers.ValidationError(
                    {"log_date": "A log already exists for this date."}
                )

        return attrs

    class Meta:
        model = WeeklyLogModel
        fields = [
            'id',
            'placement',
            'student_username',
            'student_full_name',
            'status',
            'status_display',
            'log_date',
            'description',
            'hours_spent',
            'attachment',
            'activities',
            'challenges',
            'learning',
            'week_number',
            # Workplace supervisor fields
            'workplace_reviewer_name',
            'workplace_review_date',
            'workplace_supervisor_comment',
            # Academic supervisor fields
            'academic_evaluator_name',
            'academic_evaluation_date',
            'academic_supervisor_comment',
            'marks_awarded',
            # Legacy field
            'supervisor_comment',
            'deadline',
            'submitted_at',
            'created_at',
            'updated_at',
            # Workflow state
            'can_submit_to_workplace',
            'can_submit_to_academic',
            'can_workplace_review',
            'can_academic_evaluate',
            'workflow_stage',
            'is_complete'
        ]
        
        read_only_fields = [
            'placement',  # Auto-assigned by backend
            'log_date',   # Auto-set to today's date
            'deadline',   # Auto-calculated or set by supervisor
            'status',
            'workplace_reviewer_name',
            'workplace_review_date',
            'workplace_supervisor_comment',
            'academic_evaluator_name',
            'academic_evaluation_date',
            'academic_supervisor_comment',
            'marks_awarded',
            'supervisor_comment',
            'submitted_at',
            'created_at',
            'updated_at'
        ]

