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
    
    def calculate_log_score(self):
        logs = self.weekly_logs.all()
        if not logs:
            return 0
        return sum(log.performance_score for log in logs) / logs.count()
    
    def calculate_supervisor_score(self):
        return (
            self.attendance +
            self.teamwork +
            self.communication +
            self.technical_skills
        ) / 4
        
    def calculate_total(self):
        return (self.log_score + self.supervisor_score) / 2
    def calculate_grade(self):
        if self.total_score >= 80:
            return 'A'
        elif self.total_score >= 70:
            return 'B'
        elif self.total_score >= 60:
            return 'C'
        elif self.total_score >= 50:
            return 'D'
        return 'F'
    
    def save(self, *args, **kwargs):
        self.log_score = self.calculate_log_score()