from flask import Flask
from flask_migrate import Migrate
from app.database.database import db
from app.config.settings import Config
from app.database.models import *
from flask_jwt_extended import JWTManager
from app.auth.routes import auth_bp


app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
app.register_blueprint(auth_bp, url_prefix="/auth")

with app.app_context():
    pass

@app.route("/")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True)
