from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('placement_submitted', 'Placement Submitted'),
        ('placement_approved', 'Placement Approved'),
        ('placement_rejected', 'Placement Rejected'),
        ('supervisor_assigned', 'Supervisor Assigned'),
        ('log_submitted', 'Log Submitted'),
        ('log_reviewed', 'Log Reviewed'),
        ('log_approved', 'Log Approved'),
        ('log_rejected', 'Log Rejected'),
        ('evaluation_submitted', 'Evaluation Submitted'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: Link to related objects
    related_placement_id = models.IntegerField(null=True, blank=True)
    related_log_id = models.IntegerField(null=True, blank=True)
    related_evaluation_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"
