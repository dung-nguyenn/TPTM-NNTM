import json
import os
import re

# Đường dẫn tới dữ liệu
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
CROPS_PATH = os.path.join(BASE_DIR, "data", "crops.json")
DISEASES_PATH = os.path.join(BASE_DIR, "data", "diseases.json")
PROMPTS_DIR = os.path.join(BASE_DIR, "prompts")


def load_data():
    """Tải dữ liệu cây trồng và bệnh."""
    crops, diseases = [], []
    try:
        with open(CROPS_PATH, "r", encoding="utf-8") as f:
            crops = json.load(f)
    except Exception:
        pass
    try:
        with open(DISEASES_PATH, "r", encoding="utf-8") as f:
            diseases = json.load(f)
    except Exception:
        pass
    return crops, diseases


def detect_crop(text: str, crops: list) -> dict | None:
    """Phát hiện cây trồng được đề cập trong câu hỏi."""
    text_lower = text.lower()
    for crop in crops:
        if crop["name"].lower() in text_lower:
            return crop
        for alias in crop.get("aliases", []):
            if alias.lower() in text_lower:
                return crop
    return None


def detect_disease_keywords(text: str) -> bool:
    """Kiểm tra câu hỏi có liên quan đến bệnh/sâu không."""
    disease_keywords = [
        "bệnh", "sâu", "rầy", "nấm", "héo", "vàng lá", "thối", "đốm",
        "cháy", "mốc", "sâu bệnh", "thuốc", "chữa", "trị", "phun",
        "triệu chứng", "chẩn đoán", "phòng", "lây", "rụng lá", "lá vàng"
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in disease_keywords)


def detect_care_keywords(text: str) -> bool:
    """Kiểm tra câu hỏi có liên quan đến chăm sóc không."""
    care_keywords = [
        "tưới", "bón", "phân", "chăm sóc", "trồng", "gieo", "cắt tỉa",
        "mùa vụ", "thu hoạch", "lịch", "kỹ thuật", "cách trồng", "đất",
        "ánh sáng", "nhiệt độ", "độ ẩm"
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in care_keywords)


def build_context_from_data(detected_crop: dict = None, diseases: list = None) -> str:
    """Xây dựng context từ dữ liệu để đưa vào prompt."""
    context_parts = []
    
    if detected_crop:
        context_parts.append(f"""
## Thông tin cây trồng: {detected_crop['name']}
- **Nhu cầu nước**: {detected_crop.get('water_needs', 'Chưa có thông tin')}
- **Phân bón**: {detected_crop.get('fertilizer', 'Chưa có thông tin')}
- **Mùa vụ**: {', '.join(detected_crop.get('season', []))}
- **Lưu ý chăm sóc**: {detected_crop.get('care_tips', '')}
- **Bệnh thường gặp**: {', '.join(detected_crop.get('common_diseases', []))}
""")
    
    return "\n".join(context_parts) if context_parts else ""


def build_prompt(user_message: str, conversation_context: dict = None) -> tuple[list, str]:
    """
    Xây dựng prompt hoàn chỉnh từ tin nhắn người dùng.
    
    Args:
        user_message: Tin nhắn của người dùng
        conversation_context: Ngữ cảnh cuộc hội thoại hiện tại
    
    Returns:
        Tuple (messages_list, detected_crop_id)
    """
    crops, diseases = load_data()
    
    # Phát hiện cây trồng trong câu hỏi
    detected_crop = detect_crop(user_message, crops)
    
    # Nếu không phát hiện trong câu hỏi, dùng context từ hội thoại trước
    if not detected_crop and conversation_context:
        current_crop_id = conversation_context.get("current_crop")
        if current_crop_id:
            detected_crop = next((c for c in crops if c["id"] == current_crop_id), None)
    
    # Xây dựng context
    data_context = build_context_from_data(detected_crop, diseases)
    
    # Tạo system addon nếu có context
    system_addon = ""
    if data_context:
        system_addon = f"\n\n## DỮ LIỆU THAM KHẢO TỪ HỆ THỐNG\n{data_context}"
    
    detected_crop_id = detected_crop["id"] if detected_crop else None
    return system_addon, detected_crop_id


def get_quick_suggestions(conversation_context: dict = None) -> list:
    """Trả về danh sách gợi ý câu hỏi nhanh."""
    crops, _ = load_data()
    
    base_suggestions = [
        "🌱 Cách trồng cà chua tại nhà?",
        "💧 Lúa bị vàng lá phải làm sao?",
        "🐛 Cây bị sâu ăn lá - cách xử lý?",
        "🌿 Cách bón phân cho rau cải?",
        "☀️ Mùa nào trồng dưa hấu?",
        "🌾 Phòng bệnh đạo ôn cho lúa?",
    ]
    
    if conversation_context and conversation_context.get("current_crop"):
        crop_id = conversation_context["current_crop"]
        crop = next((c for c in crops if c["id"] == crop_id), None)
        if crop:
            return [
                f"💧 {crop['name']} cần tưới bao nhiêu nước?",
                f"🌿 Cách bón phân cho {crop['name']}?",
                f"🐛 Bệnh thường gặp của {crop['name']}?",
                f"📅 Lịch thu hoạch {crop['name']}?",
                "🔄 Hỏi về cây trồng khác",
            ]
    
    return base_suggestions
