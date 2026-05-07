from rest_framework import viewsets
from .models import Evaluation
from .serializers import EvaluationSerializer
from django.http import HttpResponse

    
            
class EvaluationViewSet(viewsets.ModelViewSet):
    """
    Handles full CRUD automatically:
    -list (GET all evaluations)
    -retrieve (GET single evaluation)
    -create(POST new evaluation)
    -update (PUT/PATCH)
    -delete (DELETE)

    """
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer

def home(request):
    return HttpResponse("Welcome to ILES system 🚀")

        



