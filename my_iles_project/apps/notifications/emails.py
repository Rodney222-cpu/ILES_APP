"""
Email notification utilities for ILES App.
Sends email notifications to students when their placement status changes.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send_email(recipient_email, subject, message, html_message=None):
    """
    Generic helper to send an email. Falls back gracefully on failure.
    """
    if not recipient_email:
        logger.warning("Attempted to send email but recipient email is empty.")
        return False

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return False


def send_placement_approved_email(placement):
    """
    Send email to student when their placement is approved.
    """
    student = placement.student
    subject = f"ILES - Your Placement at {placement.company_name} Has Been Approved"

    message = (
        f"Dear {student.get_full_name() or student.username},\n\n"
        f"Great news! Your internship placement request has been approved.\n\n"
        f"Placement Details:\n"
        f"  Company: {placement.company_name}\n"
        f"  Position: {placement.position_title or 'Not specified'}\n"
        f"  Department: {placement.department or 'Not specified'}\n"
        f"  Start Date: {placement.start_date}\n"
        f"  End Date: {placement.end_date}\n"
    )

    if placement.admin_comment:
        message += f"\nAdmin Comment: {placement.admin_comment}\n"

    message += (
        f"\nPlease log in to your ILES account to view your placement details "
        f"and check for further updates.\n\n"
        f"Best regards,\n"
        f"ILES Administration"
    )

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
            <h2>Placement Approved</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear <strong>{student.get_full_name() or student.username}</strong>,</p>
            <p>Great news! Your internship placement request has been <strong style="color: #28a745;">approved</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.company_name}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Position</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.position_title or 'Not specified'}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Department</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.department or 'Not specified'}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.start_date}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.end_date}</td></tr>
            </table>
            {'<p><strong>Admin Comment:</strong> ' + placement.admin_comment + '</p>' if placement.admin_comment else ''}
            <p>Please log in to your ILES account for further updates.</p>
            <p>Best regards,<br><strong>ILES Administration</strong></p>
        </div>
    </div>
    """

    return _send_email(student.email, subject, message, html_message)


def send_placement_rejected_email(placement):
    """
    Send email to student when their placement is rejected.
    """
    student = placement.student
    subject = f"ILES - Your Placement at {placement.company_name} Was Not Approved"

    message = (
        f"Dear {student.get_full_name() or student.username},\n\n"
        f"We regret to inform you that your internship placement request has not been approved.\n\n"
        f"Placement Details:\n"
        f"  Company: {placement.company_name}\n"
        f"  Position: {placement.position_title or 'Not specified'}\n"
        f"  Start Date: {placement.start_date}\n"
        f"  End Date: {placement.end_date}\n"
    )

    if placement.admin_comment:
        message += f"\nReason for Rejection: {placement.admin_comment}\n"

    message += (
        f"\nIf you have questions or would like to discuss this decision, "
        f"please contact the administration office or submit a new placement request.\n\n"
        f"Best regards,\n"
        f"ILES Administration"
    )

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h2>Placement Not Approved</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear <strong>{student.get_full_name() or student.username}</strong>,</p>
            <p>We regret to inform you that your internship placement request has <strong style="color: #dc3545;">not been approved</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.company_name}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Position</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.position_title or 'Not specified'}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.start_date}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.end_date}</td></tr>
            </table>
            {'<p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;"><strong>Reason:</strong> ' + placement.admin_comment + '</p>' if placement.admin_comment else ''}
            <p>If you have questions, please contact the administration or submit a new placement request.</p>
            <p>Best regards,<br><strong>ILES Administration</strong></p>
        </div>
    </div>
    """

    return _send_email(student.email, subject, message, html_message)


def send_supervisor_assigned_email(placement):
    """
    Send email to student and supervisor when academic supervisor is assigned.
    """
    results = []

    # Email to student
    student = placement.student
    supervisor = placement.academic_supervisor
    subject = f"ILES - Academic Supervisor Assigned for {placement.company_name}"

    message = (
        f"Dear {student.get_full_name() or student.username},\n\n"
        f"An academic supervisor has been assigned to your internship placement.\n\n"
        f"Supervisor: {supervisor.get_full_name() or supervisor.username}\n"
        f"Company: {placement.company_name}\n"
        f"Position: {placement.position_title or 'Not specified'}\n\n"
        f"Please log in to your ILES account for more details.\n\n"
        f"Best regards,\n"
        f"ILES Administration"
    )

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
            <h2>Supervisor Assigned</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear <strong>{student.get_full_name() or student.username}</strong>,</p>
            <p>An academic supervisor has been assigned to your internship placement.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Supervisor</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{supervisor.get_full_name() or supervisor.username}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.company_name}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Position</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.position_title or 'Not specified'}</td></tr>
            </table>
            <p>Best regards,<br><strong>ILES Administration</strong></p>
        </div>
    </div>
    """

    results.append(_send_email(student.email, subject, message, html_message))

    # Email to supervisor
    if supervisor and supervisor.email:
        sup_subject = f"ILES - You Have Been Assigned as Academic Supervisor"
        sup_message = (
            f"Dear {supervisor.get_full_name() or supervisor.username},\n\n"
            f"You have been assigned as the academic supervisor for "
            f"{student.get_full_name() or student.username} "
            f"who is doing their internship at {placement.company_name}.\n\n"
            f"Position: {placement.position_title or 'Not specified'}\n"
            f"Duration: {placement.start_date} to {placement.end_date}\n\n"
            f"Please log in to your ILES account for more details.\n\n"
            f"Best regards,\n"
            f"ILES Administration"
        )

        sup_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                <h2>New Student Assigned</h2>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
                <p>Dear <strong>{supervisor.get_full_name() or supervisor.username}</strong>,</p>
                <p>You have been assigned as the academic supervisor for:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Student</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{student.get_full_name() or student.username}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.company_name}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Position</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.position_title or 'Not specified'}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Duration</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{placement.start_date} to {placement.end_date}</td></tr>
                </table>
                <p>Best regards,<br><strong>ILES Administration</strong></p>
            </div>
        </div>
        """

        results.append(_send_email(supervisor.email, sup_subject, sup_message, sup_html))

    return all(results)
