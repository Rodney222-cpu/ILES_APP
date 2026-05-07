from rest_framework import serializers
from .models import WeeklyLogModel

class WeeklyLogSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(
        source="placement.student.username",
        read_only=True
    )

    def validate_hours_spent(self, value):
        if value is None:
            return value
        if value <= 0:
            raise serializers.ValidationError("Hours must be greater than zero.")
        if value > 24:
            raise serializers.ValidationError("Hours cannot exceed 24 in one day.")
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
            'log_date',
            'description',
            'hours_spent',
            'attachment',
            'status',
            'activities',
            'challenges',
            'learning',
            'week_number',
            'supervisor_comment',
            'deadline',
            'submitted_at',
            'created_at',
            'updated_at'
            ]
        
        read_only_fields = [
            'placement',  # Auto-assigned by backend
            'log_date',   # Auto-set to today's date
            'deadline',   # Auto-calculated or set by supervisor
            'status',
            'supervisor_comment',
            'submitted_at',
            'created_at',
            'updated_at'
        ]

