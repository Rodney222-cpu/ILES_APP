from rest_framework import serializers
from django.contrib.auth import get_user_model
user = get_user_model()

class UserSerializer(serializer.ModelSerializers):
    class Meta:
        model =User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'role',
            'department',
            'staff_number'
            'student_number'
        ]
        
