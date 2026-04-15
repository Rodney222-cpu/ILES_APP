from django.db import models

class Evaluationcriteria(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank = True)
    max_score = models.IntegerField(default=10)

    def __str__(self):
        return self.name

class Evaluation(models.Model):
    placement = models.ForeignKey(
        'placements.InternshipPlacement',
        on_delete = models.CASCADE,
        related_name = 'evaluations'
    )
    evaluator_name = models.CharField(max_length=100)    
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Evaluation for {self.placement}"
    
class Evaluationscore(models.Model):
    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name = 'scores'
    )
    criteria = models.ForeignKey(
        Evaluationcriteria,
        on_delete=models.CASCADE
    )
    score = models.IntegerField()

    def __str__(self):
        return f"{self.criteria.name}: {self.score}"        

    
class Meta:
    unique_together = ["placement", "evaluator"]   



