import sqlite3
import os
import json
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chatbot.db")


def get_db_connection():
    """Tạo kết nối SQLite."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Khởi tạo cơ sở dữ liệu và tạo các bảng."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Bảng sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            last_active TEXT NOT NULL,
            context TEXT DEFAULT '{}'
        )
    """)
    
    # Bảng messages
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            has_image INTEGER DEFAULT 0,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)
    
    # Thêm cột rating nếu chưa có
    try:
        cursor.execute("ALTER TABLE messages ADD COLUMN rating INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully")


def create_session() -> str:
    """Tạo session mới và trả về session_id."""
    session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO sessions (id, created_at, last_active, context) VALUES (?, ?, ?, ?)",
        (session_id, now, now, "{}")
    )
    conn.commit()
    conn.close()
    return session_id


def session_exists(session_id: str) -> bool:
    """Kiểm tra session có tồn tại không."""
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return row is not None


def get_session_context(session_id: str) -> dict:
    """Lấy context của session."""
    conn = get_db_connection()
    row = conn.execute("SELECT context FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row["context"])
        except Exception:
            return {}
    return {}


def update_session_context(session_id: str, context: dict):
    """Cập nhật context của session."""
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    conn.execute(
        "UPDATE sessions SET context = ?, last_active = ? WHERE id = ?",
        (json.dumps(context, ensure_ascii=False), now, session_id)
    )
    conn.commit()
    conn.close()


def save_message(session_id: str, role: str, content: str, has_image: bool = False) -> int:
    """Lưu tin nhắn vào database."""
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (session_id, role, content, timestamp, has_image) VALUES (?, ?, ?, ?, ?)",
        (session_id, role, content, now, 1 if has_image else 0)
    )
    message_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return message_id


def get_conversation_history(session_id: str, limit: int = 20) -> list:
    """Lấy lịch sử hội thoại của session (giới hạn số tin nhắn)."""
    conn = get_db_connection()
    rows = conn.execute(
        """SELECT id, role, content, timestamp, rating FROM messages 
           WHERE session_id = ? 
           ORDER BY id DESC LIMIT ?""",
        (session_id, limit)
    ).fetchall()
    conn.close()
    
    # Đảo ngược để có thứ tự thời gian đúng
    messages = []
    for row in reversed(rows):
        msg = {
            "id": row["id"],
            "role": row["role"],
            "content": row["content"]
        }
        # Thêm rating nếu có
        try:
            msg["rating"] = row["rating"]
        except Exception:
            msg["rating"] = 0
        messages.append(msg)
    return messages


def update_message_rating(message_id: int, rating: int):
    """Cập nhật đánh giá của tin nhắn."""
    conn = get_db_connection()
    conn.execute("UPDATE messages SET rating = ? WHERE id = ?", (rating, message_id))
    conn.commit()
    conn.close()


def get_all_sessions() -> list:
    """Lấy danh sách tất cả sessions."""
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT id, created_at, last_active FROM sessions ORDER BY last_active DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_session(session_id: str):
    """Xóa session và toàn bộ tin nhắn."""
    conn = get_db_connection()
    conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
