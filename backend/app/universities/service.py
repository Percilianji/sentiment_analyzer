from app.database.models import University
from app.database.database import db


class UniversityService:

    @staticmethod
    def create(name, keywords):
        existing_uni = University.query.filter(University.name.ilike(name)).first()
        if existing_uni:
            raise ValueError("A university with this name already exists")

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
    def get_by_id(uni_id):
        return University.query.get(uni_id)


    @staticmethod
    def update(uni_id, data):
        uni = University.query.get(uni_id)

        if not uni:
            return None

        next_name = data.get("name", uni.name)
        existing_uni = University.query.filter(
            University.name.ilike(next_name),
            University.id != uni_id
        ).first()

        if existing_uni:
            raise ValueError("A university with this name already exists")

        uni.name = next_name
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

        uni.active = False
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return uni
