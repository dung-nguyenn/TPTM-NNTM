import os
import json
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Khởi tạo Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Đọc system prompt
SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "prompts", "system_prompt.txt")

def load_system_prompt():
    """Đọc system prompt từ file."""
    try:
        with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "Bạn là chuyên gia nông nghiệp AI, hỗ trợ người dân chăm sóc cây trồng bằng tiếng Việt."


def chat_with_groq(messages: list, system_prompt: str = None) -> str:
    """
    Gửi tin nhắn đến Groq API và nhận phản hồi.
    
    Args:
        messages: Lịch sử hội thoại dạng [{"role": "user/assistant", "content": "..."}]
        system_prompt: Prompt hệ thống tùy chỉnh (nếu None sẽ dùng mặc định)
    
    Returns:
        Chuỗi phản hồi từ AI
    """
    if system_prompt is None:
        system_prompt = load_system_prompt()
    
    # Xây dựng danh sách messages với system prompt
    full_messages = [
        {"role": "system", "content": system_prompt}
    ] + messages
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=full_messages,
            temperature=0.7,
            max_tokens=2048,
        )
        return response.choices[0].message.content
    
    except Exception as e:
        error_msg = str(e)
        if "rate_limit" in error_msg.lower():
            return "⚠️ Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau ít giây."
        elif "api_key" in error_msg.lower():
            return "⚠️ Lỗi xác thực API. Vui lòng kiểm tra lại cấu hình."
        else:
            return f"⚠️ Đã xảy ra lỗi khi kết nối AI: {error_msg[:100]}"


def chat_with_image(messages: list, image_base64: str, image_mime: str = "image/jpeg") -> str:
    """
    Gửi tin nhắn kèm ảnh đến Groq Vision API (llava).
    
    Args:
        messages: Lịch sử hội thoại
        image_base64: Ảnh dạng base64
        image_mime: Loại MIME của ảnh
    
    Returns:
        Phân tích bệnh từ AI
    """
    system_prompt = load_system_prompt()
    
    # Groq vision hiện dùng llama-3.2-11b-vision-preview
    vision_model = "llama-3.2-11b-vision-preview"
    
    # Lấy câu hỏi cuối cùng của user
    last_user_message = ""
    for msg in reversed(messages):
        if msg["role"] == "user":
            last_user_message = msg["content"] if isinstance(msg["content"], str) else ""
            break
    
    vision_message = {
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_mime};base64,{image_base64}"
                }
            },
            {
                "type": "text",
                "text": f"""Hãy phân tích ảnh cây trồng này và:
1. Mô tả những gì bạn thấy trên lá/thân/quả
2. Chẩn đoán bệnh hoặc vấn đề (nếu có)
3. Đề xuất cách xử lý cụ thể

{f'Ghi chú thêm từ người dùng: {last_user_message}' if last_user_message else ''}

Trả lời bằng tiếng Việt, chi tiết và thực tế."""
            }
        ]
    }
    
    try:
        response = client.chat.completions.create(
            model=vision_model,
            messages=[
                {"role": "system", "content": system_prompt},
                vision_message
            ],
            temperature=0.5,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    
    except Exception as e:
        error_msg = str(e)
        # Fallback: nếu vision không khả dụng, dùng model text thông thường
        fallback_messages = messages + [{
            "role": "user",
            "content": "Tôi đã gửi ảnh cây trồng nhưng chức năng phân tích ảnh hiện không khả dụng. Bạn có thể hỏi tôi mô tả triệu chứng để chẩn đoán."
        }]
        return chat_with_groq(fallback_messages, system_prompt)
