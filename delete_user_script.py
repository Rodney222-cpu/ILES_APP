"""
Script to delete a user from the database
Run this from Django shell: python manage.py shell < delete_user_script.py
"""
from apps.users.models import CustomUser

# Method 1: Delete by username
def delete_user_by_username(username):
    try:
        user = CustomUser.objects.get(username=username)
        print(f"Found user: {user.username} ({user.email}) - Role: {user.role}")
        confirm = input(f"Delete user '{username}'? (yes/no): ")
        if confirm.lower() == 'yes':
            user.delete()
            print(f"✓ User '{username}' deleted successfully!")
        else:
            print("Deletion cancelled.")
    except CustomUser.DoesNotExist:
        print(f"✗ User '{username}' not found!")

# Method 2: Delete by email
def delete_user_by_email(email):
    try:
        user = CustomUser.objects.get(email=email)
        print(f"Found user: {user.username} ({user.email}) - Role: {user.role}")
        confirm = input(f"Delete user with email '{email}'? (yes/no): ")
        if confirm.lower() == 'yes':
            user.delete()
            print(f"✓ User with email '{email}' deleted successfully!")
        else:
            print("Deletion cancelled.")
    except CustomUser.DoesNotExist:
        print(f"✗ User with email '{email}' not found!")

# Method 3: List all users
def list_all_users():
    users = CustomUser.objects.all()
    print(f"\n{'='*70}")
    print(f"Total Users: {users.count()}")
    print(f"{'='*70}")
    print(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Role':<20}")
    print(f"{'-'*70}")
    for user in users:
        print(f"{user.id:<5} {user.username:<20} {user.email:<30} {user.role:<20}")
    print(f"{'='*70}\n")

# Method 4: Delete all users of a specific role
def delete_users_by_role(role):
    users = CustomUser.objects.filter(role=role)
    count = users.count()
    if count == 0:
        print(f"✗ No users found with role '{role}'")
        return
    
    print(f"Found {count} user(s) with role '{role}':")
    for user in users:
        print(f"  - {user.username} ({user.email})")
    
    confirm = input(f"\nDelete all {count} user(s)? (yes/no): ")
    if confirm.lower() == 'yes':
        users.delete()
        print(f"✓ Deleted {count} user(s) with role '{role}'!")
    else:
        print("Deletion cancelled.")

# Interactive menu
def main():
    print("\n" + "="*70)
    print("USER DELETION TOOL")
    print("="*70)
    print("1. List all users")
    print("2. Delete user by username")
    print("3. Delete user by email")
    print("4. Delete users by role")
    print("5. Exit")
    print("="*70)
    
    choice = input("\nEnter your choice (1-5): ")
    
    if choice == '1':
        list_all_users()
    elif choice == '2':
        username = input("Enter username to delete: ")
        delete_user_by_username(username)
    elif choice == '3':
        email = input("Enter email to delete: ")
        delete_user_by_email(email)
    elif choice == '4':
        print("\nAvailable roles: student, workplace_supervisor, academic_supervisor, admin")
        role = input("Enter role: ")
        delete_users_by_role(role)
    elif choice == '5':
        print("Exiting...")
        return
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    main()
