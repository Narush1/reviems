const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let reviews = [];

function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

function calculateStats() {
  const count = reviews.length;
  if (count === 0) return { count: 0, average: "0.00" };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { count, average: (sum / count).toFixed(2) };
}

wss.on('connection', ws => {
  console.log('New client connected');

  // Отправляем сразу отзывы и статистику
  ws.send(JSON.stringify({ type: 'reviews_update', reviews, stats: calculateStats() }));

  ws.on('message', msg => {
    console.log('Received message:', msg);

    try {
      const data = JSON.parse(msg);
      if (data.type === 'new_review') {
        const { name, rating, comment } = data;

        if (
          typeof name === 'string' && name.trim() &&
          typeof comment === 'string' && comment.trim() &&
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
          console.log('Review added and broadcasted');
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid review data' }));
          console.log('Invalid data received');
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Error parsing JSON' }));
      console.log('Error parsing JSON:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
