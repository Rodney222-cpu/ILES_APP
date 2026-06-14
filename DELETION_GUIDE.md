# User Deletion Guide

## Method 1: Quick Commands

### List All Users
```bash
cd my_iles_project
python manage.py shell
```
Then in the shell:
```python
from apps.users.models import CustomUser

# List all users
for user in CustomUser.objects.all():
    print(f"ID: {user.id} | Username: {user.username} | Email: {user.email} | Role: {user.role}")
```

### Delete a User
```python
from apps.users.models import CustomUser

# Delete by username
user = CustomUser.objects.get(username='username_here')
user.delete()

# Or delete by email
user = CustomUser.objects.get(email='email@example.com')
user.delete()

# Or delete by ID
user = CustomUser.objects.get(id=5)
user.delete()
```

## Method 2: Using Batch Files

### list_users.bat
Double-click this file to see all users in your database.

### delete_user.bat
Double-click this file and enter the username you want to delete.

## Method 3: Django Admin Panel

1. Go to: http://127.0.0.1:8000/admin/
2. Log in with admin credentials
3. Click "Users" under "USERS"
4. Check the user you want to delete
5. Select "Delete selected users" from dropdown
6. Click "Go" and confirm

## Method 4: SQL Query (Direct Database)

```bash
cd my_iles_project
python manage.py dbshell
```

Then run:
```sql
-- List all users
SELECT id, username, email, role FROM users_customuser;

-- Delete a user by username
DELETE FROM users_customuser WHERE username = 'username_here';

-- Exit
.exit
```

## Examples

### Delete a test user:
```bash
python manage.py shell -c "from apps.users.models import CustomUser; CustomUser.objects.filter(username='test_user').delete(); print('Deleted!')"
```

### Delete all students:
```bash
python manage.py shell -c "from apps.users.models import CustomUser; count = CustomUser.objects.filter(role='student').count(); CustomUser.objects.filter(role='student').delete(); print(f'Deleted {count} students')"
```

### Delete user by email:
```bash
python manage.py shell -c "from apps.users.models import CustomUser; CustomUser.objects.filter(email='user@example.com').delete(); print('Deleted!')"
```

## Safety Tips

1. **Always backup your database before deleting users**
2. **List users first** to make sure you're deleting the right one
3. **Use Django Admin** for the safest method with confirmation
4. **Deleting a user will cascade delete** their placements, logs, and evaluations
