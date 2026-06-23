from app.database.models import User
from app.database.database import db
from app.auth.invites import build_setup_link, create_setup_token
from app.email.service import send_user_invite_email


class UserService:

    @staticmethod
    def create_user(name, email, role):
        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            raise ValueError("A user with this email already exists")

        token, token_hash, expires_at = create_setup_token()
        user = User(
            name=name,
            email=email,
            password_hash=None,
            password_setup_token_hash=token_hash,
            password_setup_expires_at=expires_at,
            role=role
        )

        db.session.add(user)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e

        setup_link = build_setup_link(token, user.email)
        try:
            email_sent = send_user_invite_email(user, setup_link)
        except Exception as error:
            print(f"Invite email failed for {user.email}: {error}")
            print(f"Password setup link for {user.email}: {setup_link}")
            email_sent = False

        return user, setup_link, email_sent


    @staticmethod
    def get_all_users():
        return User.query.all()


    @staticmethod
    def update_role(user_id, role):
        user = User.query.get(user_id)
        if not user:
            return None

        user.role = role
        
        try:
            db.session.commit() 
        except Exception as e:
            db.session.rollback()
            raise e
        return user


    @staticmethod
    def update_user(user_id, name=None, email=None, role=None):
        user = User.query.get(user_id)
        if not user:
            return None

        if email and email != user.email:
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                raise ValueError("A user with this email already exists")

        if name is not None:
            user.name = name

        if email is not None:
            user.email = email

        if role is not None:
            user.role = role

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return user


    @staticmethod
    def delete_user(user_id):
        user = User.query.get(user_id)
        if not user:
            return None

        db.session.delete(user)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return True
