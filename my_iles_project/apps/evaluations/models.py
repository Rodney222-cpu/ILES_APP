from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class InternshipEvaluation(models.Model):
    """
    Evaluation form filled by workplace supervisor to evaluate student performance
    """
    RATING_CHOICES = [
        (5, 'Excellent'),
        (4, 'Good'),
        (3, 'Average'),
        (2, 'Below Average'),
        (1, 'Poor'),
        (0, 'N/A - Not Applicable')
    ]
    
    # Link to placement
    placement = models.ForeignKey(
        'placements.InternshipPlacement',
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    
    # Evaluator (workplace supervisor)
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations_given'
    )
    
    # Evaluation Criteria (1-5 scale or N/A)
    punctuality_regularity = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Punctuality & Regularity"
    )
    punctuality_remarks = models.TextField(blank=True, null=True)
    
    communication_skills = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Communication Skills (Verbal/Written)"
    )
    communication_remarks = models.TextField(blank=True, null=True)
    
    professional_attitude = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Professional Attitude & Behaviour"
    )
    professional_remarks = models.TextField(blank=True, null=True)
    
    teamwork_ability = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Ability to Work in a Team"
    )
    teamwork_remarks = models.TextField(blank=True, null=True)
    
    adaptability = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Adaptability to Work Environment"
    )
    adaptability_remarks = models.TextField(blank=True, null=True)
    
    analytical_skills = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Analytical & Problem-Solving Skills"
    )
    analytical_remarks = models.TextField(blank=True, null=True)
    
    initiative_willingness = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Initiative and Willingness to Learn"
    )
    initiative_remarks = models.TextField(blank=True, null=True)
    
    work_quality = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Quality of Work Delivered"
    )
    work_quality_remarks = models.TextField(blank=True, null=True)
    
    technical_knowledge = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Technical Knowledge Related to the Field"
    )
    technical_remarks = models.TextField(blank=True, null=True)
    
    overall_contribution = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        choices=RATING_CHOICES,
        help_text="Overall Contribution to the Organization"
    )
    overall_remarks = models.TextField(blank=True, null=True)
    
    # Overall feedback
    general_comments = models.TextField(
        blank=True,
        null=True,
        help_text="General comments about the student's performance"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_average_score(self):
        """Calculate average score excluding N/A (0) ratings"""
        scores = [
            self.punctuality_regularity,
            self.communication_skills,
            self.professional_attitude,
            self.teamwork_ability,
            self.adaptability,
            self.analytical_skills,
            self.initiative_willingness,
            self.work_quality,
            self.technical_knowledge,
            self.overall_contribution
        ]
        # Filter out N/A (0) scores
        valid_scores = [s for s in scores if s > 0]
        if valid_scores:
            return sum(valid_scores) / len(valid_scores)
        return 0
    
    def __str__(self):
        return f"Evaluation for {self.placement.student.username} by {self.evaluator.username}"
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['placement', 'evaluator']  # One evaluation per supervisor per placement
