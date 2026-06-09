@echo off
title Khoi dong Chatbot Nong Nghiep - AgriBot

echo ===================================================================
echo               DUNGNGUYEN GREEN AI - CHATBOT NONG NGHIEP
echo ===================================================================
echo.
echo [*] Dang kiem tra moi truong Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren may tinh cua ban!
    echo Vui long cai dat Python va tich chon "Add Python to PATH".
    echo Tai Python tai: https://www.python.org/
    pause
    exit /b
)

:: Di chuyen vao thu muc chua file .bat nay
cd /d "%~dp0"

echo [*] Dang kiem tra thu vien...
python -c "import flask, flask_cors, groq, dotenv, PIL, requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Dang cai dat thu vien bi thieu (vui long cho)...
    pip install -r requirements.txt
) else (
    echo [OK] Tat ca thu vien da san sang.
)

echo [*] Dang kiem tra va giai phong cong ket noi 5000 (neu bi ket)...
:: Giai phong cong 5000 neu co tien trinh khac dang chiem giu
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [*] Phat hien tien trinh khac dang dung cong 5000. Dang giai phong...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [*] Dang khoi dong Backend Server...
echo [LUU Y] KHONG DONG cua so den nay khi dang su dung Chatbot!
echo ===================================================================
echo.

:: Tu dong mo trinh duyet sau 2 giay de chac chan server da bat dau
start "" cmd /c "ping 127.0.0.1 -n 3 >nul && start http://localhost:5000"

:: Chay server python
python backend/app.py

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the khoi dong server!
    echo Vui long chup anh man hinh nay gui cho minh de duoc ho tro tiep.
    pause
)
