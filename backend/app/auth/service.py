from app.database.models import User
from app.database.database import db
from app.auth.utils import check_password, hash_password


class AuthService:

    @staticmethod
    def create_user(name, email, password, role):
        # 1. Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return {"error": "User with this email already exists"}, 400

        # 2. Create new user
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
    def authenticate_user(email, password):
        user = User.query.filter_by(email=email).first()

        if not user:
            return None

        if not check_password(password, user.password_hash):
            return None

        return user
    
    