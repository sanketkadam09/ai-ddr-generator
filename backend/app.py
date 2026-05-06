from flask import Flask
from config import Config
from extensions import db, migrate
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ✅ CORS should be here
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

    # initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # import models AFTER db init
    from models.report_model import Report

    # register blueprints
    from routes.report_routes import report_bp
    app.register_blueprint(report_bp)

    @app.route("/")
    def home():
        return {"message": "DDR AI Backend Running"}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)