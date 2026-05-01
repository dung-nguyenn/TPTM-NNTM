import re
import unicodedata


def normalize_vietnamese(text: str) -> str:
    """Chuẩn hóa văn bản tiếng Việt."""
    # Loại bỏ ký tự đặc biệt không cần thiết nhưng giữ dấu tiếng Việt
    text = text.strip()
    # Chuẩn hóa whitespace
    text = re.sub(r'\s+', ' ', text)
    return text


def extract_keywords(text: str) -> list:
    """Trích xuất từ khóa quan trọng từ văn bản."""
    text_lower = text.lower()
    
    # Từ khóa bệnh tật
    disease_keywords = ["bệnh", "sâu", "rầy", "nấm", "héo", "vàng", "thối",
                        "đốm", "cháy", "mốc", "rụng", "khô"]
    # Từ khóa chăm sóc
    care_keywords = ["tưới", "bón", "phân", "trồng", "cắt", "tỉa", "thu hoạch",
                     "gieo", "ươm", "chăm"]
    
    found = []
    for kw in disease_keywords + care_keywords:
        if kw in text_lower:
            found.append(kw)
    
    return found


def truncate_text(text: str, max_length: int = 500) -> str:
    """Cắt ngắn văn bản nếu quá dài."""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."


def sanitize_input(text: str) -> str:
    """Làm sạch input người dùng."""
    if not text:
        return ""
    # Giới hạn độ dài
    text = text[:2000]
    # Loại bỏ ký tự điều khiển
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return normalize_vietnamese(text)
