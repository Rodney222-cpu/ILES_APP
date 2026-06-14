from django.db import models
from django.core.exceptions import ValidationError

class WeeklyLogModel(models.Model):
    STATUS_CHOICES = [
        ('DRAFT','Draft'),
        ('SUBMITTED','Submitted - Awaiting Workplace Review'),
        ('AUTHORIZED','Authorized - Ready for Academic Submission'),
        ('PENDING_EVALUATION','Pending Academic Evaluation'),
        ('EVALUATED','Evaluated'),
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
    
    # Workplace Supervisor Review Fields
    workplace_reviewer_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Name of the workplace supervisor who reviewed this log"
    )
    workplace_review_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Date when workplace supervisor reviewed the log"
    )
    workplace_supervisor_comment = models.TextField(
        blank=True,
        help_text="Workplace supervisor's remarks and comments"
    )
    
    # Academic Supervisor Evaluation Fields
    academic_evaluator_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Name of the academic supervisor who evaluated this log"
    )
    academic_evaluation_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Date when academic supervisor evaluated the log"
    )
    academic_supervisor_comment = models.TextField(
        blank=True,
        help_text="Academic supervisor's evaluation comments"
    )
    marks_awarded = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Marks/Grade awarded by academic supervisor"
    )
    
    # Legacy field for backward compatibility
    supervisor_comment = models.TextField(
        blank=True,
        help_text="General supervisor comments (legacy field)"
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
        ordering = ['-week_number', '-created_at']
    
    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student.username} - {self.get_status_display()}"
    
    def clean(self):
        """Validate workflow rules"""
        # Ensure log cannot jump to PENDING_EVALUATION without being AUTHORIZED
        if self.status == 'PENDING_EVALUATION' and not self.workplace_supervisor_comment:
            raise ValidationError(
                "Log must be authorized by workplace supervisor (with comments) before academic submission"
            )
        
        # Ensure marks are only awarded when evaluated
        if self.marks_awarded is not None and self.status not in ['EVALUATED', 'REJECTED']:
            raise ValidationError(
                "Marks can only be awarded when status is 'Evaluated' or 'Rejected'"
            )
    
    @property
    def can_submit_to_workplace(self):
        """Check if student can submit to workplace supervisor"""
        return self.status == 'DRAFT'
    
    @property
    def can_submit_to_academic(self):
        """Check if student can submit to academic supervisor"""
        return self.status == 'AUTHORIZED' and bool(self.workplace_supervisor_comment)
    
    @property
    def can_workplace_review(self):
        """Check if workplace supervisor can review"""
        return self.status == 'SUBMITTED'
    
    @property
    def can_academic_evaluate(self):
        """Check if academic supervisor can evaluate"""
        return self.status == 'PENDING_EVALUATION' and bool(self.workplace_supervisor_comment)
    
    @property
    def workflow_stage(self):
        """Get the current workflow stage"""
        stage_map = {
            'DRAFT': 1,
            'SUBMITTED': 2,
            'AUTHORIZED': 3,
            'PENDING_EVALUATION': 4,
            'EVALUATED': 5,
            'REJECTED': 0
        }
        return stage_map.get(self.status, 0)
    
    @property
    def is_complete(self):
        """Check if the log has completed the full workflow"""
        return self.status == 'EVALUATED'