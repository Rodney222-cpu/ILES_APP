from rest_framework import serializers
from .models import Evaluation

class EvaluationSerializer(serializers.ModelSerializers):
    class Meta:
        model = Evaluation
        fields = '__all__'
        