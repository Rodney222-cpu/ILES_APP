from django.db import models
from django.conf import settings

class InternshipPlacement(models.Model):
    status_choices = [
        ('pending_approval', 'Pending Approval'),  
        ('approved', 'Approved'),  
        ('rejected', 'Rejected'), 
        ('active', 'Active'),  
        ('completed', 'Completed')  
    ]

    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placement_as_student"
    )
    
    # Company/Organization Details
    company_name = models.CharField(max_length=200)
    company_address = models.TextField(blank=True, null=True)
    company_contact_person = models.CharField(max_length=200, blank=True, null=True)
    company_contact_email = models.EmailField(blank=True, null=True)
    company_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Internship Details
    position_title = models.CharField(max_length=200, blank=True, null=True)
    department = models.CharField(max_length=200, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    
    workplace_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="workplace_placements",
        null=True,
        blank=True
    )
    academic_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="academic_placements",
        null=True,
        blank=True
    )
    
    # Status and approval
    status = models.CharField(
        choices=status_choices,
        max_length=20,
        default='pending_approval'
    )
    admin_comment = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="approved_placements",
        null=True,
        blank=True
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.company_name} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']
