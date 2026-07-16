@echo off
title MOA 개발 서버
cd /d "%~dp0"

echo.
echo  ===================================
echo    MOA - 개발 서버 시작 중...
echo  ===================================
echo.

:: 3초 후 브라우저 열기 (백그라운드)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: 개발 서버 실행
npm run dev
