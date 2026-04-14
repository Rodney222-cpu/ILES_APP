from django.db import models

class evaluationcriteria(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank = True)
    max_score = models.IntegerField(default=10)

    def __str__(self):
        return self.name
    
class Evaluation(models.Model):
    placement = models.ForeignKey(
        'apps.placements',
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    evaluatior_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation for {self.placement}"


