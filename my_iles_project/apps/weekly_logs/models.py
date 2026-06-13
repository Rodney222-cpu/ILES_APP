from django.db import models

class WeeklyLogModel(models.Model):
    STATUS_CHOICES = [
        ('DRAFT','Draft'),
        ('SUBMITTED','Submitted'),
        ('REVIEWED','Reviewed'),
        ('APPROVED','Approved'),
        ('REJECTED','Rejected')
    ]
    
    placement = models.ForeignKey(
        'placements.InternshipPlacement', 
        on_delete=models.CASCADE
        )
    log_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    hours_spent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    attachment = models.FileField(upload_to="weekly_logs/", null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='DRAFT'
        )
    activities = models.TextField()
    challenges = models.TextField(
        blank=True
        )
    learning = models.TextField(
        blank=True
        )
    week_number = models.PositiveIntegerField()
    workplace_reviewer_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Name of the workplace supervisor who reviewed this log"
    )
    supervisor_comment = models.TextField(
        blank=True
        )
    deadline = models.DateField(null=True, blank=True)
    submitted_at = models.DateTimeField(
        blank=True, 
        null=True
        )
    created_at = models.DateTimeField(
        auto_now_add=True
        )
    updated_at = models.DateTimeField(
        auto_now=True
        )
    
    class Meta:
        unique_together = [["placement", "week_number"]]