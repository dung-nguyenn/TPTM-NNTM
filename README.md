<div align="center">

# DUNGNGUYEN GREEN AI - CHATBOT HỖ TRỢ NÔNG NGHIỆP

Hệ Thống Trợ Lý Ảo Nông Nghiệp Thông Minh Hỗ Trợ Người Dân Chăm Sóc Cây Trồng

 <img src="https://raw.githubusercontent.com/anhminhvdvn/CanhBaoDotNhap/main/images/logoDaiNam.png" width="150"> </p> <br>
<br>

![Poster dự án](Dungnguyen.jpg)

<br>
**TRƯỜNG ĐẠI HỌC ĐẠI NAM**  
**Khoa Công nghệ thông tin**

Sử dụng trí tuệ nhân tạo (AI) qua Groq API (mô hình Llama) và ứng dụng Web PWA để tư vấn kỹ thuật canh tác, chẩn đoán bệnh cây trồng qua hình ảnh và tối ưu hóa quy trình chăm sóc nông nghiệp.

🚀 Demo • ✨ Tính Năng • 📦 Cài Đặt • 📖 Tài Liệu • 🤝 Đóng Góp

</div>

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng](#-tính-năng)
- [Công Nghệ](#️-công-nghệ)
- [Kiến Trúc Hệ Thống](#️-kiến-trúc-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [Sử Dụng](#-sử-dụng)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Screenshots](#-screenshots)
- [Đóng Góp](#️-đóng-góp)
- [License](#-license)

## 🎯 Giới Thiệu
**AgriBot (DungNguyen Green AI)** là một hệ thống chatbot hỗ trợ nông nghiệp hiện đại, tích hợp công nghệ Trí tuệ nhân tạo (AI) tiên tiến giúp người nông dân dễ dàng tiếp cận kiến thức canh tác, phòng trừ sâu bệnh và quản lý cây trồng một cách khoa học.

Thông qua giao diện Web thân thiện (hỗ trợ Progressive Web App - PWA cài đặt trực tiếp lên điện thoại), người nông dân có thể trò chuyện trực tiếp với AI, tải ảnh cây bị bệnh lên để AI chẩn đoán, đồng thời nhận các lời khuyên thời tiết thực tế theo từng vùng miền. Dữ liệu hội thoại được lưu trữ cục bộ để người dùng có thể xem lại và đánh giá chất lượng phản hồi từ AI.

🌟 **Điểm Đặc Biệt**

- ✅ **Trợ lý AI chuyên sâu** - Tích hợp mô hình ngôn ngữ lớn (Llama-3.3) qua Groq API siêu tốc cho câu trả lời chính xác, nhanh chóng.
- ✅ **Chẩn đoán bệnh qua hình ảnh** - Sử dụng mô hình thị giác máy tính (Vision LLM) để phân tích ảnh chụp lá cây, thân cây bị bệnh và đưa ra giải pháp điều trị.
- ✅ **Cá nhân hóa theo thời tiết** - Đưa ra các gợi ý tưới tiêu, bón phân phù hợp với thời tiết mô phỏng từng khu vực canh tác nông nghiệp.
- ✅ **Progressive Web App (PWA)** - Cho phép cài đặt ứng dụng trực tiếp lên màn hình điện thoại/máy tính và hoạt động mượt mà.
- ✅ **Lưu trữ cục bộ** - Quản lý lịch sử hội thoại thông qua cơ sở dữ liệu SQLite, giúp người dùng không bỏ lỡ thông tin quan trọng.

## ✨ Tính Năng
🌱 **1. Tư Vấn Canh Tác Chuyên Sâu**
- Hỏi đáp về kỹ thuật gieo trồng, bón phân, tưới tiêu cho nhiều loại cây trồng khác nhau (Lúa, Cà phê, Cây ăn trái, Rau củ...).
- Tự động gợi ý các câu hỏi nhanh dựa trên ngữ cảnh hội thoại hiện tại.

📸 **2. Chẩn Đoán Bệnh Cây Trồng Bằng Hình Ảnh**
- Cho phép tải lên hoặc chụp ảnh trực tiếp các dấu hiệu bệnh trên cây trồng.
- AI phân tích hình ảnh và trả về kết quả chẩn đoán chi tiết: tên bệnh, nguyên nhân, triệu chứng và phương pháp phòng trị tối ưu.

🌦️ **3. Cập Nhật Thời Tiết & Gợi Ý Lịch Trình**
- Tích hợp dữ liệu thời tiết mô phỏng cho các vùng nông nghiệp trọng điểm (Đồng bằng sông Cửu Long, Tây Nguyên, Đồng bằng sông Hồng...).
- AI phân tích điều kiện thời tiết hiện tại để đưa ra khuyến cáo nông vụ (ví dụ: "Trời sắp mưa to, không nên bón phân").

💾 **4. Quản Lý Lịch Sử Chat & Đánh Giá**
- Lưu trữ lịch sử trò chuyện theo các phiên làm việc (Session) riêng biệt.
- Tính năng đánh giá câu trả lời của AI (👍 Thích / 👎 Không thích) để hoàn thiện và nâng cấp hệ thống dữ liệu.

## 🛠️ Công Nghệ
### Tech Stack
| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| [HTML/CSS/JS] | HTML5/CSS3/ES6 | Giao diện người dùng hiện đại, hiệu ứng Glassmorphism mượt mà |
| [Flask](https://flask.palletsprojects.com/) | 3.0.3 | Xây dựng API Backend phục vụ chat và xử lý ảnh |
| [Groq Cloud API](https://groq.com/) | 0.11.0 | Kết nối và gọi mô hình Llama-3.3-70b (Text) và Llama-3.2-11b-Vision (Image) |
| [SQLite](https://sqlite.org/) | Cục bộ | Lưu trữ cơ sở dữ liệu hội thoại, cấu hình cây trồng và bệnh hại |
| [PWA (Manifest/Service Worker)] | Tiêu chuẩn | Cung cấp khả năng cài đặt ứng dụng Web thành ứng dụng trên thiết bị di động |

## 🏗️ Kiến Trúc Hệ Thống

```text
┌─────────────────────────────────────────────────────────────┐
│                    NGƯỜI DÙNG (NÔNG DÂN)                    │
│  - Thiết bị di động / Máy tính                              │
│  - Giao diện Web / PWA (Glassmorphism)                      │
└──────────┬──────────────────────────────────────────────────┘
           │ Gửi câu hỏi / Tải ảnh lên
┌──────────▼──────────────────────────────────────────────────┐
│                      FLASK BACKEND API                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ backend/app.py (Khởi chạy ứng dụng)                   │  │
│  │ backend/routes/chat.py (Xử lý chat và tải ảnh)        │  │
│  │ backend/services/ai_service.py (Giao tiếp Groq API)   │  │
│  │ backend/database/db.py (Quản lý dữ liệu SQLite)       │  │
│  └───────────────────────┬───────────────┬───────────────┘  │
└──────────────────────────┼───────────────┼──────────────────┘
                 Ghi/Đọc   │               │ Gọi API
                           ▼               ▼
           ┌──────────────────┐  ┌──────────────────┐
           │ DATABASE SQLite  │  │   GROQ CLOUD     │
           │ (chatbot.db)     │  │ (Llama Models)   │
           └──────────────────┘  └──────────────────┘
```

## 📦 Cài Đặt
### Yêu Cầu Hệ Thống
- Đã cài đặt **Python 3.8** trở lên trên máy tính.
- Đã cấu hình biến môi trường Python trong hệ thống (PATH).
- Kết nối Internet để kết nối API của Groq Cloud.

### Bước 1: Clone Repository
```bash
git clone https://github.com/dung-nguyenn/TPTM-NNTM.git
cd TPTM-NNTM
```

### Bước 2: Cấu Hình Biến Môi Trường
- Tạo file `.env` nằm trong thư mục gốc của dự án (hoặc kiểm tra file `.env` hiện tại).
- Cập nhật các khóa cấu hình sau:
```env
GROQ_API_KEY=Khóa_API_Groq_Của_Bạn
GROQ_MODEL=llama-3.3-70b-versatile
FLASK_SECRET_KEY=khoa_bi_mat_flask_cua_ban
FLASK_DEBUG=True
```
*(Bạn có thể lấy khóa API miễn phí từ [Groq Console](https://console.groq.com/))*

### Bước 3: Khởi Chạy Dự Án
Chỉ cần nhấp đúp (Double-click) vào file khởi chạy tự động được tích hợp sẵn:
- Chạy file `chay_chatbot.bat` (trên Windows).
- Chương trình sẽ tự động kiểm tra môi trường Python, tự cài đặt các thư viện cần thiết từ `requirements.txt`, giải phóng cổng bị kẹt và tự động mở trình duyệt truy cập: `http://localhost:5000`.

## 🚀 Sử Dụng

1. **Khởi chạy ứng dụng**: Bấm chạy `chay_chatbot.bat`, giao diện sẽ tự động hiển thị trên trình duyệt.
2. **Nhập thông tin nông hộ**: Điền các thông tin như tên, khu vực, loại cây trồng đang quan tâm để chatbot cá nhân hóa câu trả lời tốt hơn.
3. **Chat và hỏi đáp**: Nhập các câu hỏi nông nghiệp vào ô chat hoặc chọn nhanh các câu hỏi gợi ý tự động của hệ thống.
4. **Phân tích hình ảnh**: Nhấn vào nút đính kèm ảnh (biểu tượng máy ảnh/ghim), chọn một ảnh chụp lá cây bị bệnh để gửi cho AI chẩn đoán.
5. **Xem lại lịch sử**: Bạn có thể quản lý các phiên hội thoại cũ tại phần danh sách lịch sử để xem lại bất cứ lúc nào.

## 📂 Cấu Trúc Thư Mục
Dự án được tổ chức rõ ràng theo mô hình MVC thu gọn:
```text
TPTM-NNTM/
├── backend/
│   ├── database/         # Quản lý kết nối, khởi tạo và truy vấn SQLite
│   ├── routes/           # Các endpoint xử lý API chat, hình ảnh, session
│   ├── services/         # Logic kết nối API Groq AI và xử lý prompts
│   ├── utils/            # Các hàm tiện ích xử lý chuỗi văn bản
│   └── app.py            # File chạy chính của server Flask
├── data/
│   ├── chatbot.db        # Cơ sở dữ liệu SQLite lưu trữ dữ liệu
│   ├── crops.json        # Dữ liệu mô tả các loại cây trồng
│   └── diseases.json     # Dữ liệu mô tả các loại bệnh hại
├── frontend/
│   ├── index.html        # Giao diện chính của ứng dụng
│   ├── style.css         # CSS giao diện với hiệu ứng Glassmorphism hiện đại
│   ├── chat_ui.js        # Logic điều khiển, hiển thị tin nhắn, gọi API
│   ├── manifest.json     # Cấu hình PWA để cài đặt ứng dụng
│   └── sw.js             # Service Worker hỗ trợ caching
├── prompts/
│   └── system_prompt.txt # Chỉ thị hệ thống định hướng hành vi của AI
├── chay_chatbot.bat      # Script Windows để chạy dự án bằng 1-Click
└── requirements.txt      # Khai báo các thư viện Python phụ thuộc
```

## 📸 Screenshots
*(Bạn có thể thêm hình ảnh giao diện AgriBot vào đây)*

## 🤝 Đóng Góp
Mọi ý kiến đóng góp, báo lỗi (issues) và đề xuất tính năng mới đều được chào đón!

1. Fork repository này.
2. Tạo một nhánh mới (`git checkout -b feature/AmazingFeature`).
3. Commit các thay đổi của bạn (`git commit -m 'Add some AmazingFeature'`).
4. Push lên nhánh vừa tạo (`git push origin feature/AmazingFeature`).
5. Tạo một Pull Request mới để chúng ta cùng thảo luận.

## 📄 License
Dự án này được cấp phép theo giấy phép MIT License - xem chi tiết tại file `LICENSE`.

## 👨💻 Tác Giả
**Dũng Nguyễn**

- GitHub: [@dung-nguyenn](https://github.com/dung-nguyenn)
- Trường Đại Học Đại Nam

⭐ **Nếu dự án AgriBot này hữu ích với bạn, hãy ủng hộ một ngôi sao (star) nhé!** ⭐
