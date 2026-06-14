#!/usr/bin/env python
"""
Simple script to delete a user by username
Usage: python manage.py shell -c "exec(open('delete_user_simple.py').read())"
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_iles_project.settings')
django.setup()

from apps.users.models import CustomUser

# Change this to the username you want to delete
USERNAME_TO_DELETE = "test_user"  # ← CHANGE THIS

try:
    user = CustomUser.objects.get(username=USERNAME_TO_DELETE)
    print(f"Found user: {user.username} ({user.email}) - Role: {user.role}")
    user.delete()
    print(f"✓ User '{USERNAME_TO_DELETE}' deleted successfully!")
except CustomUser.DoesNotExist:
    print(f"✗ User '{USERNAME_TO_DELETE}' not found!")
except Exception as e:
    print(f"✗ Error: {e}")
