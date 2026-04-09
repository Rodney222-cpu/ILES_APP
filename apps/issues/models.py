from django.db import models

class Issue(models.Model):
    STATUS_CHOICES - [
        ('open', 'Open'),
        ('in progress', 'In progress'),
        ('resolved', 'Resolved'),
    ] 

    title = models.CharField(max_length = 255)
    description = models.TextField()
    reported_by = models.CharField(max_length=100)  
    assigned_to = models.CharField(max_lenth = 100, blank = True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default = 'open')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title



