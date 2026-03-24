@echo off
echo Starting server... > server_log.txt
cd /d "%~dp0"
call npx tsx src/index.ts >> server_log.txt 2>&1
echo Done. >> server_log.txt
