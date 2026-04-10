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

