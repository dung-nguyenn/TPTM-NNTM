import sys
import os

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Thêm thư mục gốc vào Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database và routes
from backend.database.db import init_db
from backend.routes.chat import chat_bp

def create_app():
    """Tạo và cấu hình Flask app."""
    app = Flask(__name__, static_folder=None)
    
    # Cấu hình
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "agribot-secret")
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload
    
    # CORS - cho phép frontend gọi API
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Đăng ký blueprints
    app.register_blueprint(chat_bp)
    
    # Route phục vụ frontend
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
    
    @app.route("/")
    def index():
        return send_from_directory(frontend_dir, "index.html")
    
    @app.route("/<path:filename>")
    def static_files(filename):
        return send_from_directory(frontend_dir, filename)
    
    return app


if __name__ == "__main__":
    print("[AgriBot] Khoi dong server...")
    
    # Khởi tạo database
    init_db()
    
    # Tạo app
    app = create_app()
    
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    
    print("[OK] Server san sang tai: http://localhost:5000")
    print("[OK] Mo trinh duyet va truy cap http://localhost:5000")
    print("[OK] Su dung Groq API model:", os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"))
    print("-" * 50)
    
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=debug_mode
    )
