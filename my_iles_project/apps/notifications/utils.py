from .models import Notification


def create_notification(recipient, notification_type, title, message, **kwargs):
    """
    Helper function to create notifications
    """
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        related_placement_id=kwargs.get('related_placement_id'),
        related_log_id=kwargs.get('related_log_id'),
        related_evaluation_id=kwargs.get('related_evaluation_id')
    )


def notify_placement_submitted(placement, admin_users):
    """Notify admins when student submits placement"""
    for admin in admin_users:
        create_notification(
            recipient=admin,
            notification_type='placement_submitted',
            title='New Placement Request',
            message=f'{placement.student.username} submitted a placement request for {placement.company_name}',
            related_placement_id=placement.id
        )


def notify_placement_approved(placement):
    """Notify student when placement is approved"""
    create_notification(
        recipient=placement.student,
        notification_type='placement_approved',
        title='Placement Approved',
        message=f'Your placement request for {placement.company_name} has been approved!',
        related_placement_id=placement.id
    )


def notify_placement_rejected(placement):
    """Notify student when placement is rejected"""
    create_notification(
        recipient=placement.student,
        notification_type='placement_rejected',
        title='Placement Rejected',
        message=f'Your placement request for {placement.company_name} was rejected. Reason: {placement.admin_comment}',
        related_placement_id=placement.id
    )


def notify_supervisor_assigned(placement):
    """Notify both student and supervisor when supervisor is assigned"""
    # Notify student
    create_notification(
        recipient=placement.student,
        notification_type='supervisor_assigned',
        title='Supervisor Assigned',
        message=f'{placement.academic_supervisor.username} has been assigned as your academic supervisor',
        related_placement_id=placement.id
    )
    
    # Notify supervisor
    if placement.academic_supervisor:
        create_notification(
            recipient=placement.academic_supervisor,
            notification_type='supervisor_assigned',
            title='New Student Assigned',
            message=f'You have been assigned as academic supervisor for {placement.student.username} at {placement.company_name}',
            related_placement_id=placement.id
        )


def notify_log_submitted(log, supervisors):
    """Notify supervisors when student submits a log"""
    for supervisor in supervisors:
        create_notification(
            recipient=supervisor,
            notification_type='log_submitted',
            title='New Log Submitted',
            message=f'{log.student.username} submitted Week {log.week_number} log',
            related_log_id=log.id
        )


def notify_log_reviewed(log):
    """Notify student when log is reviewed"""
    create_notification(
        recipient=log.student,
        notification_type='log_reviewed',
        title='Log Reviewed',
        message=f'Your Week {log.week_number} log has been reviewed by your supervisor',
        related_log_id=log.id
    )


def notify_log_approved(log):
    """Notify student when log is approved"""
    create_notification(
        recipient=log.student,
        notification_type='log_approved',
        title='Log Approved',
        message=f'Your Week {log.week_number} log has been approved!',
        related_log_id=log.id
    )


def notify_log_rejected(log):
    """Notify student when log is rejected"""
    create_notification(
        recipient=log.student,
        notification_type='log_rejected',
        title='Log Rejected',
        message=f'Your Week {log.week_number} log was rejected. Please review the feedback.',
        related_log_id=log.id
    )


def notify_evaluation_submitted(evaluation):
    """Notify student when evaluation is submitted"""
    create_notification(
        recipient=evaluation.placement.student,
        notification_type='evaluation_submitted',
        title='Evaluation Completed',
        message=f'Your supervisor has completed your internship evaluation',
        related_evaluation_id=evaluation.id
    )
