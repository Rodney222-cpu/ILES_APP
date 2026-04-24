from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework.exceptions import ValidationError

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'username',
            'password',
            'role',
            'student_number',
            'staff_number',
            'department'
        ]

    
    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)

        try:
            user.save()
        except Exception as e:
            raise serializers.ValidationError({"detail": str(e)})

        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        role = data.get("role")
        student_number = data.get("student_number")
        staff_number = data.get("staff_number")

        if role == "student":
            if not student_number:
                raise serializers.ValidationError({
                    "student_number": "Student must have a student number"
                })
            if staff_number:
                raise serializers.ValidationError({
                    "staff_number": "Student cannot have a staff number"
                })

        if role in ["workplace_supervisor", "academic_supervisor"]:
            if not staff_number:
                raise serializers.ValidationError({
                    "staff_number": "Supervisor must have a staff number"
                })
            if student_number:
                raise serializers.ValidationError({
                    "student_number": "Supervisor cannot have a student number"
                })

        if role == "admin":
            if student_number:
                raise serializers.ValidationError({
                    "student_number": "Admin should not have a student number"
                })

        return data