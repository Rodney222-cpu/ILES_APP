from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework.exceptions import ValidationError

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'role',
            'student_number',
            'staff_number',
            'department',
            'company_name'
        ]

    def validate_email(self, value):
        # Check if email is already taken
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        role = data.get('role')
        student_number = data.get('student_number')
        staff_number = data.get('staff_number')
        company_name = data.get('company_name')

        # STUDENT VALIDATION
        if role == 'student':
            if not student_number:
                raise serializers.ValidationError({
                    'student_number': 'Student must have a student number'
                })
            if staff_number:
                raise serializers.ValidationError({
                    'staff_number': 'Students cannot have a staff number'
                })

        # WORKPLACE SUPERVISOR VALIDATION
        if role == 'workplace_supervisor':
            if not staff_number:
                raise serializers.ValidationError({
                    'staff_number': 'Workplace supervisor must have a staff number'
                })
            if not company_name:
                raise serializers.ValidationError({
                    'company_name': 'Workplace supervisor must have a company name'
                })
            if student_number:
                raise serializers.ValidationError({
                    'student_number': 'Supervisors cannot have a student number'
                })
            # Clear student_number if accidentally provided
            data['student_number'] = None

        # ACADEMIC SUPERVISOR VALIDATION
        if role == 'academic_supervisor':
            if not staff_number:
                raise serializers.ValidationError({
                    'staff_number': 'Academic supervisor must have a staff number'
                })
            if student_number:
                raise serializers.ValidationError({
                    'student_number': 'Supervisors cannot have a student number'
                })
            # Clear student_number if accidentally provided
            data['student_number'] = None

        # ADMIN VALIDATION
        if role == 'admin':
            if student_number:
                raise serializers.ValidationError({
                    'student_number': 'Admins cannot have a student number'
                })
            # Clear student_number if accidentally provided
            data['student_number'] = None

        return data
    
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
        username = data.get("username")
        password = data.get("password")

        # Authenticate the user
        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError({
                "detail": "Invalid username or password"
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "detail": "User account is disabled"
            })

        # Add the user object to validated_data
        data["user"] = user
        return data