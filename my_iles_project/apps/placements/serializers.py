from rest_framework import serializers
from .models import InternshipPlacement


class InternshipPlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source="student.username", read_only=True)
    student_number = serializers.CharField(source="student.student_number", read_only=True)
    workplace_supervisor_username = serializers.CharField(
        source="workplace_supervisor.username",
        read_only=True,
        allow_null=True
    )
    academic_supervisor_username = serializers.CharField(
        source="academic_supervisor.username",
        read_only=True,
        allow_null=True
    )
    approved_by_username = serializers.CharField(
        source="approved_by.username",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = InternshipPlacement
        fields = [
            'id',
            'student',
            'student_username',
            'student_number',
            'company_name',
            'company_address',
            'company_contact_person',
            'company_contact_email',
            'company_contact_phone',
            'position_title',
            'department',
            'start_date',
            'end_date',
            'workplace_supervisor',
            'workplace_supervisor_username',
            'academic_supervisor',
            'academic_supervisor_username',
            'status',
            'admin_comment',
            'approved_by',
            'approved_by_username',
            'approved_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'student',
            'status',
            'admin_comment',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
            'workplace_supervisor',
            'academic_supervisor'
        ]

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if self.instance:
            start_date = start_date or self.instance.start_date
            end_date = end_date or self.instance.end_date

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {'end_date': 'End date must be after start date.'}
            )

        return attrs
