from django.shortcuts import render, redirect, get_object_or_404
from .models import Evaluation
from .forms import EvaluationForm

def creat_evaluation(request):
    if request.method == "POST"
        form = EvaluationForm(request.POST)
        if form. is_valid():
            form.save()
            return redirect('evaluation list')
    else:
        form = EvaluationForm()
    return render(request, 'create_evaluation.html',  {'form': form})

def evaluation_list(request):
    evaluations = Evaluation.objects.all()
    return render(request, 'evaluation_list.html', {'evaluations': evaluation})


        


# Create your views here.
