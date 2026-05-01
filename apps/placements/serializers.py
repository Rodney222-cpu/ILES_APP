from rest_framework import serializers
from .models import InternshipPlacement

class InternshipPlacementSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source = 'student.get_full_name')
    workplace_supervisor_name = serializers.ReadOnlyField(source = 'workplace_supervisor.get_full_name')
    academic_supervisor_name = serializers.ReadOnlyField(source = 'academic_supervisor.get_full_name')
    class Meta:
        model = InternshipPlacement
        fields = '__all__'
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("The end date must be after the start date.")
        return data      