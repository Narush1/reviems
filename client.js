(() => {
  const ws = new WebSocket(`ws://${window.location.host}`);

  const reviewsEl = document.getElementById('reviews');
  const statsEl = document.getElementById('stats');
  const form = document.getElementById('reviewForm');

  function renderReviews(reviews) {
    reviewsEl.innerHTML = '';
    if (reviews.length === 0) {
      reviewsEl.textContent = 'Пока нет отзывов.';
      return;
    }
    reviews.slice().reverse().forEach(r => {
      const div = document.createElement('div');
      div.className = 'review';

      div.innerHTML = `
        <div class="review-header">
          <strong>${escapeHTML(r.name)}</strong>
          <span class="rating">${r.rating.toFixed(1)}</span>
        </div>
        <div class="review-comment">${escapeHTML(r.comment)}</div>
      `;
      reviewsEl.appendChild(div);
    });
  }

  function updateStats(stats) {
    statsEl.textContent = `Всего отзывов: ${stats.count} | Средняя оценка: ${stats.average}`;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim();
    const comment = form.comment.value.trim();
    let rating = parseFloat(form.rating.value);

    if (!name || !comment) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    if (isNaN(rating) || rating < 0 || rating > 5) {
      alert('Оценка должна быть от 0.0 до 5.0');
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'new_review', name, rating, comment }));
      form.reset();
    } else {
      alert('Соединение с сервером потеряно.');
    }
  });

  ws.addEventListener('open', () => {
    console.log('WebSocket подключён');
  });

  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.type === 'reviews_update') {
      updateStats(data.stats);
      renderReviews(data.reviews);
    }
  });

  ws.addEventListener('close', () => {
    console.log('WebSocket отключён');
  });

  ws.addEventListener('error', () => {
    console.error('Ошибка WebSocket');
  });

  // Безопасный вывод текста (просто чтобы не было XSS)
  function escapeHTML(text) {
    return text.replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }
})();
