from django.db import models
from django.conf import settings


class Evaluation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations_received',
        limit_choices_to={'role': 'student'}
    )

    workplace_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workplace_evaluations',
        limit_choices_to={'role': 'workplace'}
    )

    academic_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='academic_evaluations',
        limit_choices_to={'role': 'academic'}
    )

    internship = models.ForeignKey(
        'internship.InternshipPlacement',
        on_delete=models.CASCADE,
        related_name='evaluations'
    )

    weekly_logs = models.ManyToManyField(
        'weeklylog.WeeklyLog',
        related_name='evaluations',
        blank=True
    )

    attendance = models.PositiveIntegerField(default=0)
    punctuality = models.PositiveIntegerField(default=0)
    teamwork = models.PositiveIntegerField(default=0)
    communication = models.PositiveIntegerField(default=0)
    technical_skills = models.PositiveIntegerField(default=0)
    workplace_comment = models.TextField(blank=True, null=True)
    academic_comment = models.TextField(blank=True, null=True)
    
    log_score = models.FloatField(default=0)
    supervisor_score = models.FloatField(default=0)
    total_score = models.FloatField(editable=False, default=0)
    grade = models.CharField(max_length=2, blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
