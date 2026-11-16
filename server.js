import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { Bot, webhookCallback, InlineKeyboard } from 'grammy';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN || '';
const BASE = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const MAX_PLAYERS = 30;
const hookPath = '/tg-' + crypto.createHash('sha256').update(TOKEN).digest('hex').slice(0, 24);

// ---------- Telegram bot (webhook) ----------
let hook = null, bot = null;
if (TOKEN) {
  bot = new Bot(TOKEN);
  bot.command('start', (ctx) =>
    ctx.reply('🛻 Зимний Бурабай онлайн!\nRaptor R, Ram TRX/RHO, G 63 6x6 и Escalade. Жми «Играть» и катайся с друзьями.',
      { reply_markup: new InlineKeyboard().webApp('🛻 Играть онлайн', BASE || 'https://example.com') }));
  hook = webhookCallback(bot, 'http');
}

// ---------- HTTP: игра + webhook ----------
const srv = http.createServer((req, res) => {
  if (hook && req.method === 'POST' && req.url === hookPath) return hook(req, res);
  if (req.url === '/health') { res.end('ok'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(fs.readFileSync(path.join(dir, 'public', 'index.html')));
});

// ---------- WebSocket: игроки ----------
const wss = new WebSocketServer({ server: srv, path: '/ws', maxPayload: 1024 });
const players = new Map();
let nextId = 1;
const num = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(+v) ? +v : 0));
const clean = (n) => String(n || 'Игрок').replace(/[<>&"'`]/g, '').slice(0, 18) || 'Игрок';

function verify(init) { // проверка подписи Telegram, чтобы нельзя было подделать имя
  if (!init || !TOKEN) return null;
  try {
    const u = new URLSearchParams(init), hash = u.get('hash'); u.delete('hash');
    const check = [...u.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
    const key = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest();
    if (crypto.createHmac('sha256', key).update(check).digest('hex') !== hash) return null;
    const user = JSON.parse(u.get('user') || '{}');
    return clean(user.first_name || user.username);
  } catch { return null; }
}

wss.on('connection', (ws) => {
  if (players.size >= MAX_PLAYERS) { ws.close(1013, 'full'); return; }
  const id = nextId++;
  const me = { id, n: 'Игрок', vi: 0, x: 0, z: 0, psi: 0, v: 0, st: 0, l: 0, d: 0, t: 0 };
  players.set(id, me);
  ws.alive = true;
  ws.on('pong', () => (ws.alive = true));
  ws.send(JSON.stringify({ t: 'hi', id }));
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'j') { me.n = verify(m.init) || clean(m.n); }
    else if (m.t === 's') {
      const now = Date.now(); if (now - me.t < 40) return; me.t = now;
      me.x = num(m.x, -400, 400); me.z = num(m.z, -400, 400); me.psi = num(m.psi, -1e4, 1e4);
      me.v = num(m.v, -60, 60); me.st = num(m.st, -1, 1); me.vi = num(m.vi, 0, 4) | 0;
      me.l = m.l ? 1 : 0; me.d = m.d ? 1 : 0;
    }
  });
  ws.on('close', () => players.delete(id));
});

setInterval(() => { // рассылка состояния 15 раз в секунду
  if (!wss.clients.size) return;
  const msg = JSON.stringify({ t: 'w', p: [...players.values()].map(({ t, ...p }) => p) });
  wss.clients.forEach((c) => c.readyState === 1 && c.send(msg));
}, 66);
setInterval(() => wss.clients.forEach((c) => { if (!c.alive) return c.terminate(); c.alive = false; c.ping(); }), 30000);

srv.listen(PORT, async () => {
  console.log('Сервер запущен, порт', PORT);
  if (bot && BASE) {
    try {
      await bot.init();
      await bot.api.setWebhook(BASE + hookPath);
      await bot.api.setChatMenuButton({ menu_button: { type: 'web_app', text: 'Играть', web_app: { url: BASE } } });
      console.log('Бот подключён:', BASE);
    } catch (e) { console.error('Ошибка бота:', e.message); }
  } else console.log('BOT_TOKEN или адрес не заданы: бот выключен, игра доступна по адресу сервера');
});
