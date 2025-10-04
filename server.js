// Импортируем необходимые модули
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Отзывы храним в памяти
let reviews = [];

// Функция для подсчета статистики
function getStats() {
  const count = reviews.length;
  const avg = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  return { count, average: avg };
}

// Отправляем всем клиентам обновления
function broadcastReviews() {
  const data = JSON.stringify({
    type: 'update',
    reviews,
    stats: getStats()
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Middleware для отдачи статики
app.use(express.static(path.join(__dirname)));

// Парсинг JSON тела (если понадобится)
app.use(express.json());

// Обработка подключения WebSocket
wss.on('connection', ws => {
  // При новом клиенте сразу отправляем текущие отзывы и статистику
  ws.send(JSON.stringify({
    type: 'update',
    reviews,
    stats: getStats()
  }));

  // Обработка входящих сообщений
  ws.on('message', message => {
    try {
      const data = JSON.parse(message);

      // Проверяем, что это новый отзыв
      if (data.type === 'new_review') {
        const review = data.review;

        // Валидация на сервере
        if (
          typeof review.name !== 'string' || review.name.trim() === '' ||
          typeof review.comment !== 'string' || review.comment.trim() === '' ||
          typeof review.rating !== 'number' || isNaN(review.rating) ||
          review.rating < 0 || review.rating > 5 ||
          Math.round(review.rating * 10) !== review.rating * 10 // точность до 1 знака после запятой
        ) {
          ws.send(JSON.stringify({ type: 'error', message: 'Неверные данные отзыва' }));
          return;
        }

        // Обрезаем поля и добавляем отзыв
        reviews.push({
          name: review.name.trim(),
          rating: review.rating,
          comment: review.comment.trim()
        });

        // Рассылаем обновления всем клиентам
        broadcastReviews();
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Некорректный формат данных' }));
    }
  });
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
