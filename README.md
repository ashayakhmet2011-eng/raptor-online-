# Зимний Бурабай — онлайн в Telegram

В папке: `server.js` (игра + онлайн + бот), `public/index.html` (сама игра), `render.yaml`, `package.json`.

## Запуск за 10 минут (бесплатно)

### 1. Создайте бота
В Telegram откройте @BotFather → `/newbot` → имя и username → получите **токен**.
Токен никому не показывайте. Если он утёк, в @BotFather выберите бота → API Token → Revoke.

### 2. Загрузите файлы на GitHub
github.com → New repository → Add file → Upload files → перетащите **содержимое** этой папки
(`server.js`, `package.json`, `render.yaml`, папку `public`) → Commit.

### 3. Запустите сервер на Render
render.com → войти через GitHub → New + → **Web Service** → выберите репозиторий.
- Runtime: Node
- Build Command: `npm install`
- Start Command: `node server.js`
- Instance Type: Free
- Environment → Add: `BOT_TOKEN` = токен из шага 1
Нажмите Deploy. Через минуту откройте `https://ВАШЕ-ИМЯ.onrender.com/health` — должно быть «ok».
Сервер сам подключит бота и кнопку «Играть» (адрес берётся автоматически).

### 4. Играйте
Откройте бота в Telegram → /start → «Играть онлайн». Откройте с двух телефонов — увидите друг друга.
Ссылку на бота (t.me/имя_бота) можно отправлять друзьям.

## Важно
- На бесплатном тарифе Render сервер засыпает через 15 минут без игроков, первый вход после сна занимает до минуты.
- Ограничение: до 30 игроков на сервере, чужие машины показываются для 9 ближайших по очереди подключения.
- Проверка локально: `npm install && node server.js`, откройте http://localhost:3000 (без Telegram имя будет случайным).
