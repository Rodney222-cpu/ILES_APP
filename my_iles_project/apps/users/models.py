from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class CustomUser(AbstractUser):
    ROLES = [
        ('student','Student'),
        ('workplace_supervisor','Workplace Supervisor'),
        ('academic_supervisor','Academic Supervisor'),
        ('admin', 'Administrator')
        ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLES, 
        default='student'
        )
    department = models.CharField(
        max_length=150, 
        blank=True, 
        null=True
        )
    staff_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        unique=True
        )
    student_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=True
        )
    

    def clean(self):
        # STUDENT RULES
        if self.role == "student":
            if not self.student_number:
                raise ValidationError({
                    "student_number": "Student must have a student number"
                })
            if self.staff_number:
                raise ValidationError({
                    "staff_number": "Student cannot have a staff number"
                })

        # SUPERVISOR RULES
        if self.role in ["workplace_supervisor", "academic_supervisor"]:
            if not self.staff_number:
                raise ValidationError({
                    "staff_number": "Supervisor must have a staff number"
                })
            if self.student_number:
                raise ValidationError({
                    "student_number": "Supervisor cannot have a student number"
                })

        # ADMIN 
        if self.role == "admin":
            if self.student_number:
                raise ValidationError({
                    "student_number": "Admin should not have a student number"
                })


    # FORCE VALIDATION

    def save(self, *args, **kwargs):
        self.full_clean()  # runs clean() + field validation
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"




