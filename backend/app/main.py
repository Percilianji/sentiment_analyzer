from flask import Flask
from flask_migrate import Migrate
from app.database.database import db
from app.config.settings import Config
import os
from app.database.models import *
from flask_jwt_extended import JWTManager
from app.auth.routes import auth_bp
from app.users.routes import users_bp
from app.universities.routes import universities_bp
from app.topics.routes import topics_bp
from app.scraping.scheduler import start_scheduler
from app.scraping.routes import scraping_bp
from app.nlp.routes import nlp_bp
from app.dashboard.routes import dashboard_bp


app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(universities_bp, url_prefix="/universities")
app.register_blueprint(topics_bp, url_prefix="/topics")
app.register_blueprint( scraping_bp, url_prefix="/scraping")
app.register_blueprint(nlp_bp, url_prefix="/nlp")
app.register_blueprint(dashboard_bp, url_prefix="/dashboard")


with app.app_context():
    if os.getenv("AUTO_SCRAPING_ENABLED", "false").lower() == "true":
        start_scheduler(app)
    pass

@app.route("/")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True)
