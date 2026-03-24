@echo off
echo Running Prisma DB Push... > sync_db_log.txt
call npx prisma db push --accept-data-loss >> sync_db_log.txt 2>&1
echo. >> sync_db_log.txt
echo Running Prisma Generate... >> sync_db_log.txt
call npx prisma generate >> sync_db_log.txt 2>&1
echo Done. >> sync_db_log.txt
