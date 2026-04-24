from rest_framework import serializers
from .models import WeeklyLogModel

class WeeklyLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = WeeklyLogModel
        fields = [
            'id',
            'placement',
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
            'status',
            'supervisor_comment',
            'submitted_at',
            'created_at',
            'updated_at'
        ]

