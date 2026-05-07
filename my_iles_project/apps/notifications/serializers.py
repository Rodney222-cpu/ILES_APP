from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 
            'is_read', 'created_at', 'related_placement_id',
            'related_log_id', 'related_evaluation_id'
        ]
        read_only_fields = ['id', 'created_at']
