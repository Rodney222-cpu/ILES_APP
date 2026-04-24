from django.db import models

class WeeklyLogModel(models.Model):
    STATUS_CHOICES = [
        ('DRAFT','Draft'),
        ('SUBMITTED','Submitted'),
        ('REVIEWED','Reviewed'),
        ('APPROVED','Approved')
    ]
    
    placement = models.ForeignKey(
        'placements.InternshipPlacement', 
        on_delete=models.CASCADE
        )
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
    supervisor_comment = models.TextField(
        blank=True
        )
    deadline = models.DateField()
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
   
