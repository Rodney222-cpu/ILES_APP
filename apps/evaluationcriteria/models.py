from django.db import models

class evaluationcriteria(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank = True)
    max_score = models.IntegerField(default=10)

    def __str__(self):
        return self.name



