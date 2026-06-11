from django.db import migrations


def set_default_emails(apps, schema_editor):
    """Assign unique placeholder emails to users with blank emails."""
    CustomUser = apps.get_model('users', 'CustomUser')
    for user in CustomUser.objects.all():
        if not user.email:
            user.email = f"{user.username}@placeholder.com"
            # Use update to bypass the model's save/clean validation
            CustomUser.objects.filter(pk=user.pk).update(email=user.email)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_customuser_role'),
    ]

    operations = [
        migrations.RunPython(set_default_emails, migrations.RunPython.noop),
    ]
