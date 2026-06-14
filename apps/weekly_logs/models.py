from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class WeeklyLog(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_WORKPLACE_REVIEW', 'Pending Workplace Supervisor Review'),
        ('AUTHORIZED_FOR_ACADEMIC', 'Authorized for Academic Submission'),
        ('PENDING_ACADEMIC_EVALUATION', 'Pending Academic Evaluation'),
        ('EVALUATED', 'Evaluated')
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'student'},
        related_name='weekly_logs'
    )
    placement = models.ForeignKey(
        'placements.InternshipPlacement', 
        on_delete=models.CASCADE,
        related_name='weekly_logs'
    )
    status = models.CharField(
        max_length=40, 
        choices=STATUS_CHOICES, 
        default='DRAFT'
    )
    
    # Log content
    week_number = models.PositiveIntegerField()
    hours_spent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Total hours spent this week"
    )
    activities = models.TextField(
        help_text="Activities performed during the week"
    )
    description = models.TextField(
        help_text="Detailed description of work done",
        blank=True
    )
    challenges = models.TextField(
        blank=True,
        help_text="Challenges encountered during the week"
    )
    learning = models.TextField(
        blank=True,
        help_text="Learning outcomes and insights gained"
    )
    
    # Student submission tracking
    submitted_to_workplace_at = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="When student submitted to workplace supervisor"
    )
    submitted_to_academic_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When student submitted to academic supervisor"
    )
    
    # Workplace supervisor authorization
    workplace_reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workplace_reviewed_logs',
        limit_choices_to={'role': 'workplace'}
    )
    workplace_remarks = models.TextField(
        blank=True,
        help_text="Workplace supervisor's remarks"
    )
    workplace_review_date = models.DateTimeField(
        blank=True,
        null=True
    )
    is_authorized = models.BooleanField(
        default=False,
        help_text="Whether workplace supervisor has authorized this log"
    )
    
    # Academic supervisor evaluation
    academic_evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_evaluated_logs',
        limit_choices_to={'role': 'academic'}
    )
    academic_comments = models.TextField(
        blank=True,
        help_text="Academic supervisor's evaluation comments"
    )
    marks_awarded = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Marks/grade awarded by academic supervisor"
    )
    evaluation_date = models.DateTimeField(
        blank=True,
        null=True
    )
    
    # Metadata
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [["placement", "week_number"]]
        ordering = ['-week_number']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['placement', 'week_number'])
        ]
    
    def __str__(self):
        return f"Week {self.week_number} - {self.student.get_full_name()} - {self.get_status_display()}"
    
    def clean(self):
        """Validate workflow rules"""
        # Ensure student cannot skip workplace review
        if self.status == 'PENDING_ACADEMIC_EVALUATION' and not self.is_authorized:
            raise ValidationError(
                "Log must be authorized by workplace supervisor before academic submission"
            )
        
        # Ensure marks are only awarded when evaluated
        if self.marks_awarded is not None and self.status != 'EVALUATED':
            raise ValidationError(
                "Marks can only be awarded when status is 'Evaluated'"
            )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def can_submit_to_workplace(self):
        """Check if student can submit to workplace supervisor"""
        return self.status == 'DRAFT'
    
    @property
    def can_submit_to_academic(self):
        """Check if student can submit to academic supervisor"""
        return self.status == 'AUTHORIZED_FOR_ACADEMIC' and self.is_authorized
    
    @property
    def can_workplace_review(self):
        """Check if workplace supervisor can review"""
        return self.status == 'PENDING_WORKPLACE_REVIEW'
    
    @property
    def can_academic_evaluate(self):
        """Check if academic supervisor can evaluate"""
        return self.status == 'PENDING_ACADEMIC_EVALUATION' and self.is_authorized
   