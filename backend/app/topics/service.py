from app.database.models import Topic
from app.database.database import db


class TopicService:

    @staticmethod
    def create(name, keywords):
        topic = Topic(
            name=name,
            keywords=keywords
        )

        db.session.add(topic)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e

        return topic

    @staticmethod
    def get_all():
        return Topic.query.all()

    @staticmethod
    def get_by_id(topic_id):
        return Topic.query.get(topic_id)

    @staticmethod
    def update(topic_id, data):
        topic = Topic.query.get(topic_id)

        if not topic:
            return None

        topic.name = data.get("name", topic.name)
        topic.keywords = data.get("keywords", topic.keywords)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e

        return topic

    @staticmethod
    def delete(topic_id):
        topic = Topic.query.get(topic_id)

        if not topic:
            return False

        db.session.delete(topic)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
       

        return True