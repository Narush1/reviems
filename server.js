const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let reviews = [];

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function calculateStats() {
  if (reviews.length === 0) return { count: 0, average: "0.00" };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { count: reviews.length, average: (sum / reviews.length).toFixed(2) };
}

wss.on('connection', ws => {
  // Отправляем текущие отзывы и статистику сразу после подключения
  ws.send(JSON.stringify({ type: 'reviews_update', reviews, stats: calculateStats() }));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'new_review') {
        const { name, rating, comment } = data;

        if (
          typeof name === 'string' && name.trim() !== '' &&
          typeof comment === 'string' && comment.trim() !== '' &&
          typeof rating === 'number' && rating >= 0 && rating <= 5
        ) {
          const review = {
            id: Date.now(),
            name: name.trim(),
            rating: Math.round(rating * 10) / 10,
            comment: comment.trim()
          };
          reviews.push(review);
          broadcast({ type: 'reviews_update', reviews, stats: calculateStats() });
        }
      }
    } catch (e) {
      // Ошибка в JSON или что-то ещё — игнорируем
      console.error('Ошибка при обработке сообщения от клиента:', e);
    }
  });

  ws.on('close', () => {
    // Можно добавить логику при отключении, если нужно
  });
});

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
