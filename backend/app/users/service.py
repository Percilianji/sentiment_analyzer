from app.database.models import User
from app.database.database import db
from app.auth.utils import hash_password


class UserService:

    @staticmethod
    def create_user(name, email, password, role):
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role
        )

        db.session.add(user)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return user


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