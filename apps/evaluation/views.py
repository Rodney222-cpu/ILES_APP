from django.shortcuts import render, redirect, get_object_or_404
from .models import Evaluation
from .forms import EvaluationForm

def create_evaluation(request):
    if request.method == "POST":
        form = EvaluationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('evaluation list')
    else:
        form = EvaluationForm()
    return render(request, 'create_evaluation.html',  {'form': form})

def evaluation_list(request):
    evaluations = Evaluation.objects.all()
    return render(request, 'evaluation_list.html', {'evaluations': evaluations})

def update_evaluation(request, pk):
    evaluation = get_object_or_404(Evaluation, id=pk)

    if request.method == 'POST':
        form = EvaluationForm(request.POST, instance=evaluation)
        if form.is_valid():
            form.save()
            return redirect('evaluation_list')
    else:
        form = EvaluationForm(instance = evaluation)

    return render(request, 'update_evaluation.html', {'form': form})  

def delete_evaluation(request, pk):
    evaluation = get_object_or_404(Evaluation, id=pk)

    if request.method == 'POST':
        evaluation.delete()
        return redirect('evaluation_list')
    return render(request, 'delete_evaluation.html', {'evaluation': evaluation})      
            

        



