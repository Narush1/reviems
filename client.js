(() => {
  const ws = new WebSocket(`ws://${window.location.host}`);

  const stars = Array.from(document.querySelectorAll('#starRating .star'));
  let selectedRating = 0;

  const reviewsContainer = document.getElementById('reviewsContainer');
  const statsContainer = document.getElementById('statsContainer');

  function updateStars(rating) {
    stars.forEach((star, i) => {
      if (i < rating) {
        star.textContent = '★';
        star.classList.add('selected');
      } else {
        star.textContent = '☆';
        star.classList.remove('selected');
      }
    });
  }

  stars.forEach((star, i) => {
    star.addEventListener('mouseenter', () => updateStars(i + 1));
    star.addEventListener('mouseleave', () => updateStars(selectedRating));
    star.addEventListener('click', () => {
      selectedRating = i + 1;
      updateStars(selectedRating);
    });
  });

  function renderReviews(reviews) {
    reviewsContainer.innerHTML = '';
    reviews.slice().reverse().forEach(({ name, rating, comment }) => {
      const review = document.createElement('div');
      review.classList.add('review');

      const header = document.createElement('div');
      header.classList.add('review-header');

      const userName = document.createElement('div');
      userName.textContent = name;

      const starsElem = document.createElement('div');
      starsElem.classList.add('review-stars');
      starsElem.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);

      header.appendChild(userName);
      header.appendChild(starsElem);

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

    if (!name || !comment) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }
    if (selectedRating === 0) {
      alert('Пожалуйста, поставьте оценку.');
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'new_review',
        name,
        rating: selectedRating,
        comment
      }));

      form.reset();
      selectedRating = 0;
      updateStars(0);
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
