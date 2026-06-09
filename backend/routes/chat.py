import base64
from flask import Blueprint, request, jsonify
from backend.database.db import (
    create_session, session_exists, get_session_context,
    update_session_context, save_message, get_conversation_history, delete_session
)
from backend.services.ai_service import chat_with_groq, chat_with_image, load_system_prompt
from backend.services.prompt_builder import build_prompt, get_quick_suggestions
from backend.utils.text_processing import sanitize_input

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/session", methods=["POST"])
def create_new_session():
    """Tạo session mới."""
    session_id = create_session()
    return jsonify({
        "session_id": session_id,
        "message": "Session created successfully",
        "suggestions": get_quick_suggestions()
    })


@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    """
    Endpoint chat chính.
    Body: { "session_id": "...", "message": "...", "weather": "...", "profile": {...} }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Không có dữ liệu"}), 400
    
    session_id = data.get("session_id", "")
    user_message = sanitize_input(data.get("message", ""))
    weather_info = data.get("weather", "")
    profile_info = data.get("profile", {})
    
    if not user_message:
        return jsonify({"error": "Tin nhắn không được để trống"}), 400
    
    # Tạo session nếu chưa có
    if not session_id or not session_exists(session_id):
        session_id = create_session()
    
    # Lấy lịch sử hội thoại và context
    history = get_conversation_history(session_id, limit=10)
    context = get_session_context(session_id)
    
    # Xây dựng prompt với context từ dữ liệu + thời tiết + thông tin cá nhân
    system_addon, detected_crop_id = build_prompt(user_message, context, weather_info, profile_info)
    
    # Cập nhật context nếu phát hiện cây mới
    if detected_crop_id:
        context["current_crop"] = detected_crop_id
        update_session_context(session_id, context)
    
    # Xây dựng danh sách messages (chỉ gửi role và content cho AI)
    ai_history = [{"role": msg["role"], "content": msg["content"]} for msg in history]
    messages = ai_history + [{"role": "user", "content": user_message}]
    
    # Lấy system prompt + addon
    base_system = load_system_prompt()
    full_system = base_system + system_addon if system_addon else base_system
    
    # Gọi AI
    ai_response = chat_with_groq(messages, system_prompt=full_system)
    
    # Lưu vào database và lấy message_id
    user_msg_id = save_message(session_id, "user", user_message)
    assistant_msg_id = save_message(session_id, "assistant", ai_response)
    
    # Gợi ý câu hỏi tiếp theo
    suggestions = get_quick_suggestions(context)
    
    return jsonify({
        "session_id": session_id,
        "response": ai_response,
        "suggestions": suggestions,
        "detected_crop": detected_crop_id,
        "user_message_id": user_msg_id,
        "assistant_message_id": assistant_msg_id
    })


@chat_bp.route("/api/chat/image", methods=["POST"])
def chat_with_image_endpoint():
    """
    Endpoint phân tích ảnh cây bệnh.
    FormData: session_id, message (optional), image (file)
    """
    session_id = request.form.get("session_id", "")
    user_message = sanitize_input(request.form.get("message", ""))
    
    if "image" not in request.files:
        return jsonify({"error": "Không có file ảnh"}), 400
    
    image_file = request.files["image"]
    
    # Kiểm tra loại file
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if image_file.mimetype not in allowed_types:
        return jsonify({"error": "Chỉ chấp nhận ảnh JPG, PNG, WEBP"}), 400
    
    # Đọc và encode ảnh
    image_data = image_file.read()
    image_base64 = base64.b64encode(image_data).decode("utf-8")
    
    # Tạo session nếu chưa có
    if not session_id or not session_exists(session_id):
        session_id = create_session()
    
    # Lấy lịch sử hội thoại
    history = get_conversation_history(session_id, limit=5)
    ai_history = [{"role": msg["role"], "content": msg["content"]} for msg in history]
    messages = ai_history + [{"role": "user", "content": user_message or "Phân tích bệnh trong ảnh này"}]
    
    # Gọi AI với ảnh
    ai_response = chat_with_image(messages, image_base64, image_file.mimetype)
    
    # Lưu vào database
    msg_content = f"[Ảnh được gửi]{': ' + user_message if user_message else ''}"
    user_msg_id = save_message(session_id, "user", msg_content, has_image=True)
    assistant_msg_id = save_message(session_id, "assistant", ai_response)
    
    return jsonify({
        "session_id": session_id,
        "response": ai_response,
        "suggestions": get_quick_suggestions(),
        "user_message_id": user_msg_id,
        "assistant_message_id": assistant_msg_id
    })


@chat_bp.route("/api/sessions", methods=["GET"])
def get_sessions_list():
    """Lấy danh sách tất cả sessions."""
    from backend.database.db import get_all_sessions
    try:
        sessions = get_all_sessions()
        return jsonify({"sessions": sessions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/api/message/rate", methods=["POST"])
def rate_message():
    """Đánh giá tin nhắn 👍/👎."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Không có dữ liệu"}), 400
    
    message_id = data.get("message_id")
    rating = data.get("rating")  # 1: thích, -1: ghét, 0: không đánh giá
    
    if message_id is None or rating is None:
        return jsonify({"error": "Thiếu message_id hoặc rating"}), 400
    
    from backend.database.db import update_message_rating
    try:
        update_message_rating(int(message_id), int(rating))
        return jsonify({"status": "success", "message": "Đã lưu đánh giá"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/api/history", methods=["GET"])
def get_history():
    """Lấy lịch sử hội thoại của session."""
    session_id = request.args.get("session_id", "")
    
    if not session_id or not session_exists(session_id):
        return jsonify({"messages": [], "context": {}})
    
    history = get_conversation_history(session_id, limit=50)
    context = get_session_context(session_id)
    
    return jsonify({
        "session_id": session_id,
        "messages": history,
        "context": context
    })


@chat_bp.route("/api/session", methods=["DELETE"])
def clear_session():
    """Xóa session và lịch sử hội thoại."""
    data = request.get_json()
    session_id = data.get("session_id", "") if data else ""
    
    if session_id and session_exists(session_id):
        delete_session(session_id)
        return jsonify({"message": "Session đã được xóa"})
    
    return jsonify({"message": "Session không tồn tại"}), 404


@chat_bp.route("/api/health", methods=["GET"])
def health_check():
    """Kiểm tra trạng thái server."""
    return jsonify({
        "status": "ok",
        "message": "AgriBot API đang hoạt động 🌱"
    })
