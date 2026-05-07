from rest_framework import serializers
from .models import InternshipEvaluation


class InternshipEvaluationSerializer(serializers.ModelSerializer):
    evaluator_username = serializers.CharField(source="evaluator.username", read_only=True)
    student_username = serializers.CharField(source="placement.student.username", read_only=True)
    company_name = serializers.CharField(source="placement.company_name", read_only=True)
    average_score = serializers.SerializerMethodField()

    class Meta:
        model = InternshipEvaluation
        fields = [
            'id',
            'placement',
            'evaluator',
            'evaluator_username',
            'student_username',
            'company_name',
            'punctuality_regularity',
            'punctuality_remarks',
            'communication_skills',
            'communication_remarks',
            'professional_attitude',
            'professional_remarks',
            'teamwork_ability',
            'teamwork_remarks',
            'adaptability',
            'adaptability_remarks',
            'analytical_skills',
            'analytical_remarks',
            'initiative_willingness',
            'initiative_remarks',
            'work_quality',
            'work_quality_remarks',
            'technical_knowledge',
            'technical_remarks',
            'overall_contribution',
            'overall_remarks',
            'general_comments',
            'average_score',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['evaluator', 'created_at', 'updated_at']

    def get_average_score(self, obj):
        return obj.calculate_average_score()
