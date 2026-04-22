from django import forms

class EvaluationForm(forms.Form):
    name = forms.CharField(max_length = 100)
    