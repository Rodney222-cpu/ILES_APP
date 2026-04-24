from django.db import models
from django.conf import settings

class InternshipPlacement(models.Model):
    status_choices = [
        ('pending','Pending'),
        ('active', 'Active'),
        ('completed','Completed')
    ]

    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placement_as_student"
    )
    workplace_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workplace_placements" 
    )
    academic_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_placements"
    )
    company_name = models.CharField(
        max_length=200
    )
    company_address = models.TextField(
        blank=True,
        null=True
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        choices=status_choices,
        max_length=20,
        default='pending'
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
