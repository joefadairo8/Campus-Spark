@echo off
echo Stopping any running server process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a
echo.
echo Regenerating Prisma Client...
call npx prisma generate

echo.
echo Pushing Schema changes to DB...
call npx prisma db push

echo.
echo Starting Server...
call npm run dev
