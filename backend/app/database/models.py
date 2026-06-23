from datetime import datetime
from app.database.database import db


#  USER
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    password_setup_token_hash = db.Column(db.String(64), nullable=True)
    password_setup_expires_at = db.Column(db.DateTime, nullable=True)
    password_set_at = db.Column(db.DateTime, nullable=True)
    role = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


#  UNIVERSITY
class University(db.Model):
    __tablename__ = "universities"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    keywords = db.Column(db.Text)
    active = db.Column(db.Boolean, default=True)
    sentiment_index = db.Column(db.Float, default=0.0)


#  TOPIC
class Topic(db.Model):
    __tablename__ = "topics"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    keywords = db.Column(db.Text)


#  POST
# class Post(db.Model):
#     __tablename__ = "posts"
#     id = db.Column(db.Integer, primary_key=True)
#     university_id = db.Column(db.Integer, db.ForeignKey("universities.id"), nullable=False)
#     content = db.Column(db.Text, nullable=False)
#     author = db.Column(db.String(120))
#     source = db.Column(db.String(100))
#     url = db.Column(db.Text)
#     post_date = db.Column(db.DateTime)
#     content_hash = db.Column(db.String(32),unique=True,nullable=False) 
#     __table_args__ = (
#     db.Index("idx_content_hash", "content_hash"),
#     db.Index("idx_url", "url"),)
#     url = db.Column(db.Text,unique=True)
#     collected_at = db.Column(db.DateTime, default=datetime.utcnow)
#     is_deleted = db.Column(db.Boolean, default=False)

class Post(db.Model):
    __tablename__ = "posts"
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.Integer,db.ForeignKey("universities.id"),nullable=False)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(120))
    source = db.Column(db.String(100))
    url = db.Column(db.Text, nullable=False)
    topic = db.Column(db.String(100), nullable=True)
    source_type = db.Column(db.String(20),default="full_page",nullable=False)
    post_date = db.Column(db.DateTime)
    content_hash = db.Column(db.String(64),unique=True,nullable=False)
    collected_at = db.Column(db.DateTime,default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    __table_args__ = (
        db.Index("idx_content_hash", "content_hash"),
        db.Index("idx_url", "url"),
        db.Index("idx_source_type", "source_type"),
    )

class CleanedText(db.Model):
    __tablename__ = "cleaned_texts"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer,db.ForeignKey("posts.id"),nullable=False,unique=True )
    cleaned_content = db.Column(db.Text, nullable=False)
    source_type = db.Column(db.String(20), nullable=False)
    __table_args__ = (
    db.Index("idx_cleaned_post_id", "post_id"),
    db.Index("idx_cleaned_source_type", "source_type"),
)
# SENTIMENT RESULT
class SentimentResult(db.Model):
    __tablename__ = "sentiment_results"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), unique=True)
    vader_score = db.Column(db.Float)
    xlm_label = db.Column(db.String(50))
    final_label = db.Column(db.String(20))
    is_event = db.Column(db.Boolean, default=False)
    classified_at = db.Column(db.DateTime, default=datetime.utcnow)
    post_date = db.Column(db.DateTime)

# SUMMARY
class Summary(db.Model):
    __tablename__ = "summaries"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), unique=True)
    summary_text = db.Column(db.Text)


#  REPORT
class Report(db.Model):
    __tablename__ = "reports"
    id = db.Column(db.Integer, primary_key=True)
    generated_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    file_path = db.Column(db.Text)
    report_type = db.Column(db.String(50))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
