@echo off
echo ===============================================
echo DELETE USER FROM DATABASE
echo ===============================================
echo.
set /p username="Enter username to delete: "
echo.
echo Searching for user '%username%'...
cd my_iles_project
python manage.py shell -c "from apps.users.models import CustomUser; user = CustomUser.objects.filter(username='%username%').first(); print(f'\nUser found: {user.username} ({user.email}) - Role: {user.role}') if user else print('\nUser not found!'); user.delete() if user and input('Delete this user? (yes/no): ').lower() == 'yes' else print('Cancelled')"
echo.
echo ===============================================
pause
