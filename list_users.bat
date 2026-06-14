@echo off
echo ===============================================
echo LISTING ALL USERS IN DATABASE
echo ===============================================
cd my_iles_project
python manage.py shell -c "from apps.users.models import CustomUser; users = CustomUser.objects.all(); print(f'\nTotal Users: {users.count()}\n'); print(f'{'ID':<5} {'Username':<20} {'Email':<30} {'Role':<20}'); print('-'*75); [print(f'{u.id:<5} {u.username:<20} {u.email:<30} {u.role:<20}') for u in users]"
echo.
echo ===============================================
pause
