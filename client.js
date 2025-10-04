(() => {
  const ws = new WebSocket(`ws://${window.location.host}`);

  const starContainer = document.getElementById('starRating');
  const stars = Array.from(starContainer.children);
  let selectedRating = 0;

  const reviewsContainer = document.getElementById('reviewsContainer');

  // Создаем контейнер для статистики
  let statsContainer = document.getElementById('statsContainer');
  if (!statsContainer) {
    statsContainer = document.createElement('div');
    statsContainer.id = 'statsContainer';
    reviewsContainer.parentNode.insertBefore(statsContainer, reviewsContainer);
  }

  // Обновление отображения звёздочек
  function updateStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.textContent = '★';
        star.classList.add('selected');
      } else {
        star.textContent = '☆';
        star.classList.remove('selected');
      }
    });
  }

  // Навешиваем события на звёздочки
  stars.forEach((star, index) => {
    star.style.cursor = 'pointer';

    star.addEventListener('click', () => {
      selectedRating = index + 1;
      updateStars(selectedRating);
    });

    star.addEventListener('mouseenter', () => {
      updateStars(index + 1);
    });

    star.addEventListener('mouseleave', () => {
      updateStars(selectedRating);
    });
  });

  // Обновление статистики
  function updateStats(stats) {
    statsContainer.textContent = `Всего отзывов: ${stats.count} | Средняя оценка: ${stats.average}`;
  }

  // Отрисовка отзывов
  function renderReviews(reviews) {
    reviewsContainer.innerHTML = '';
    reviews.slice().reverse().forEach(({ name, rating, comment, id }) => {
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
    console.log('WebSocket подключен');
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
