@echo off

REM Prompt for environment variables
set /p TOKEN=Enter your Discord bot token: 
set /p CHANNEL_ID=Enter your Discord channel ID: 
set /p JWT_SECRET=Enter your JWT secret: 
set /p NEXT_PUBLIC_IS_VERCEL=Enter true/false for NEXT_PUBLIC_IS_VERCEL: 
set /p DOCKER=Enter your Docker value: 
set /p NODE_ENV=Enter development or production for NODE_ENV: 

REM Clone the repository
git clone https://github.com/Lychan23/Ly.JSxPy.git
cd Ly.JSxPy

REM Create a virtual environment and activate it
python -m venv .venv
call .venv\Scripts\activate

REM Install Python dependencies
pip install -r requirements.txt
pip install aiohttp aiosqlite python-dotenv discord.py pygame pyttsx3 pyautogui numpy imageio pynput pillow

REM Install Node.js dependencies
npm install @types/bcrypt@^5.0.2 @types/js-cookie@^3.0.6 @types/jsonwebtoken@^9.0.6 @types/react@^18.3.3 @vercel/analytics@^1.3.1 @vercel/speed-insights@^1.0.12 autoprefixer@^10.4.19 axios@^1.7.2 bcrypt@^5.1.1 chalk@^5.3.0 eslint@^9.6.0 js-cookie@^3.0.5 jsonwebtoken@^9.0.2 next@^14.2.5 postcss@^8.4.39 postcss-loader@^8.1.1 react@^18.3.1 socket.io@^4.7.5 socket.io-client@^4.7.5 sqlite@^5.1.1 sqlite3@^5.1.7 tailwindcss@^3.4.4 typescript@5.5.3

echo Project setup is complete.
pause
