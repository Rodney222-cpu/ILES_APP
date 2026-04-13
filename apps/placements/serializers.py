from rest_framework import serializers
from .models import InternshipPlacement

class InternshipPlacementserializer(serializers.modelsSerializer):
    student_name = serializers.ReadOnlyField(source = 'student.get_full_name')
    workplace_supervisor_name = serializers.ReadOnlyField(source = 'workplace_supervisor.get_full_name')
    academic_supervisor_name = serializers.ReadOnlyField(source = 'academic_supervisor.get_full_name')