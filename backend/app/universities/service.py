from app.database.models import University
from app.database.database import db


class UniversityService:

    @staticmethod
    def create(name, keywords):
        uni = University(
            name=name,
            keywords=keywords,
            active=True,
            sentiment_index=0.0
        )

        db.session.add(uni)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return uni


    @staticmethod
    def get_all():
        return University.query.all()


    @staticmethod
    def get_active():
        return University.query.filter_by(active=True).all()


    @staticmethod
    def update(uni_id, data):
        uni = University.query.get(uni_id)

        if not uni:
            return None

        uni.name = data.get("name", uni.name)
        uni.keywords = data.get("keywords", uni.keywords)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return uni


    @staticmethod
    def toggle_status(uni_id):
        uni = University.query.get(uni_id)

        if not uni:
            return None

        uni.active = not uni.active
    
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return uni


    @staticmethod
    def delete(uni_id):
        uni = University.query.get(uni_id)

        if not uni:
            return None

        db.session.delete(uni)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return True