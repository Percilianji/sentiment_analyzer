from flask import current_app
from flask_mail import Message

from app.email.extensions import mail


def send_user_invite_email(user, setup_link):
    mail_server = current_app.config.get("MAIL_SERVER")
    mail_sender = (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
    )

    if not mail_server or not mail_sender:
        print(f"Password setup link for {user.email}: {setup_link}")
        return False

    message = Message(
        subject="Set up your UniPulse account",
        recipients=[user.email],
        sender=mail_sender,
    )
    message.body = f"""
Hello {user.name},

An account has been created for you on UniPulse.

Email: {user.email}
Role: {user.role}

Click the link below to set up your password:

{setup_link}

This link expires in 24 hours.

If you did not expect this email, please ignore it.
"""

    mail.send(message)

    return True
