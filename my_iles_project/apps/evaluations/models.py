from django.db import models
from django.conf import settings


class EvaluationCriteria(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)
    weight_percent = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"{self.name} ({self.weight_percent}%)"
    

class Evaluation(models.Model):
    placement = models.ForeignKey(
        'placements.InternshipPlacement', 
        on_delete=models.CASCADE, 
        related_name='evaluations'
        )
    
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='given_evaluations'
    )
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def evaluate_score(self):
        total = 0

        for item in self.scores.all():
            total =+ (
                item.score / item.criteria.max_score
            ) * item.criteria.weight_percent
        return total    
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['placement', 'evaluator'], 
                name='unique_field_combination'
                )
        ]

    def __str__(self):
        return f"Evaluation for {self.placement}"
    

class EvaluationScore(models.Model):
    evaluation = models.ForeignKey(
        Evaluation, 
        on_delete=models.CASCADE, 
        related_name='scores'
        ) 

    criteria = models.ForeignKey(
        EvaluationCriteria, 
        on_delete=models.CASCADE
        ) 

    score = models.DecimalField(max_digits=5, decimal_places=2) 

    def __str__(self):
        return f"{self.evaluation} - {self.criteria}: {self.score}"


    
   