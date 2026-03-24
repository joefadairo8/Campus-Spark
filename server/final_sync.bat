@echo off
set LOG=final_sync_log.txt
echo [%DATE% %TIME%] Syncing DB... > %LOG%
call npx prisma db push --accept-data-loss >> %LOG% 2>&1
echo [%DATE% %TIME%] Generating Client... >> %LOG%
call npx prisma generate >> %LOG% 2>&1
echo [%DATE% %TIME%] Checking Table Structure... >> %LOG%
call npx prisma db pull >> %LOG% 2>&1
echo DONE. >> %LOG%
