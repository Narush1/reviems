(() => {
  const ws = new WebSocket(`ws://${window.location.host}`);

  const reviewsContainer = document.getElementById('reviewsContainer');
  const statsContainer = document.getElementById('statsContainer');

  function renderReviews(reviews) {
    reviewsContainer.innerHTML = '';
    reviews.slice().reverse().forEach(({ name, rating, comment }) => {
      const review = document.createElement('div');
      review.classList.add('review');

      const header = document.createElement('div');
      header.classList.add('review-header');

      const userName = document.createElement('div');
      userName.textContent = name;

      const ratingElem = document.createElement('div');
      ratingElem.classList.add('review-rating');
      ratingElem.textContent = rating.toFixed(1);

      header.appendChild(userName);
      header.appendChild(ratingElem);

      const commentElem = document.createElement('div');
      commentElem.classList.add('review-comment');
      commentElem.textContent = comment;

      review.appendChild(header);
      review.appendChild(commentElem);

      reviewsContainer.appendChild(review);
    });
  }

  function updateStats(stats) {
    statsContainer.textContent = `Всего отзывов: ${stats.count} | Средняя оценка: ${stats.average}`;
  }

  const form = document.getElementById('reviewForm');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name = form.name.value.trim();
    const comment = form.comment.value.trim();
    let rating = parseFloat(form.rating.value);

    if (!name || !comment) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    if (isNaN(rating) || rating < 0 || rating > 5) {
      alert('Пожалуйста, введите оценку от 0.0 до 5.0');
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'new_review',
        name,
        rating,
        comment
      }));
      form.reset();
    } else {
      alert('Нет соединения с сервером');
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
    } else if (data.type === 'error') {
      alert(`Ошибка сервера: ${data.message}`);
    }
  });

  ws.addEventListener('close', () => {
    console.log('WebSocket отключён');
  });

  ws.addEventListener('error', err => {
    console.error('WebSocket ошибка:', err);
  });
})();
