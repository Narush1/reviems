// client.js - логика клиента для отзывов с WebSocket

(() => {
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${wsProtocol}//${location.host}`);

  // DOM элементы
  const form = document.getElementById('review-form');
  const inputName = document.getElementById('name');
  const inputRating = document.getElementById('rating');
  const inputComment = document.getElementById('comment');

  const errorName = document.getElementById('error-name');
  const errorRating = document.getElementById('error-rating');
  const errorComment = document.getElementById('error-comment');
  const formMessage = document.getElementById('form-message');

  const reviewsCountElem = document.getElementById('reviews-count');
  const reviewsAverageElem = document.getElementById('reviews-average');
  const reviewsList = document.getElementById('reviews-list');

  // Очистка ошибок
  function clearErrors() {
    errorName.textContent = '';
    errorRating.textContent = '';
    errorComment.textContent = '';
    formMessage.textContent = '';
    formMessage.className = 'form-message';
  }

  // Валидация формы клиентом
  function validateForm() {
    clearErrors();

    let valid = true;

    const name = inputName.value.trim();
    if (!name) {
      errorName.textContent = 'Имя обязательно';
      valid = false;
    } else if (name.length < 2) {
      errorName.textContent = 'Имя слишком короткое';
      valid = false;
    }

    const ratingRaw = inputRating.value;
    const rating = parseFloat(ratingRaw);
    if (ratingRaw === '') {
      errorRating.textContent = 'Оценка обязательна';
      valid = false;
    } else if (isNaN(rating) || rating < 0 || rating > 5) {
      errorRating.textContent = 'Оценка должна быть от 0.0 до 5.0';
      valid = false;
    } else {
      // Проверяем точность до 1 знака после запятой
      if (Math.round(rating * 10) !== rating * 10) {
        errorRating.textContent = 'Оценка должна иметь одну десятичную';
        valid = false;
      }
    }

    const comment = inputComment.value.trim();
    if (!comment) {
      errorComment.textContent = 'Комментарий обязателен';
      valid = false;
    } else if (comment.length < 5) {
      errorComment.textContent = 'Комментарий слишком короткий';
      valid = false;
    }

    return valid;
  }

  // Отрисовка отзывов
  function renderReviews(reviews) {
    if (!Array.isArray(reviews)) return;

    reviewsList.innerHTML = '';

    if (reviews.length === 0) {
      reviewsList.innerHTML = '<p class="no-reviews">Пока нет отзывов.</p>';
      return;
    }

    // Создаем DOM для каждого отзыва
    for (const review of reviews) {
      const div = document.createElement('article');
      div.className = 'review';

      div.innerHTML = `
        <header>
          <strong class="review-name">${escapeHTML(review.name)}</strong>
          <span class="review-rating">${review.rating.toFixed(1)}</span>
        </header>
        <p class="review-comment">${escapeHTML(review.comment)}</p>
      `;

      reviewsList.appendChild(div);
    }
  }

  // Экранирование HTML (для безопасности)
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

  // Обновление статистики
  function renderStats(stats) {
    reviewsCountElem.textContent = stats.count;
    reviewsAverageElem.textContent = stats.average.toFixed(2);
  }

  // Обработка сообщений от сервера
  ws.addEventListener('message', evt => {
    try {
      const data = JSON.parse(evt.data);
      if (data.type === 'update') {
        renderReviews(data.reviews);
        renderStats(data.stats);
      } else if (data.type === 'error') {
        formMessage.textContent = data.message;
        formMessage.className = 'form-message error';
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
  });

  // Обработка ошибок соединения
  ws.addEventListener('close', () => {
    formMessage.textContent = 'Соединение с сервером потеряно.';
    formMessage.className = 'form-message error';
  });

  // Отправка отзыва
  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!validateForm()) return;

    // Подготовка данных
    const review = {
      name: inputName.value.trim(),
      rating: parseFloat(inputRating.value),
      comment: inputComment.value.trim()
    };

    // Отправляем через WebSocket
    ws.send(JSON.stringify({ type: 'new_review', review }));

    formMessage.textContent = 'Отзыв отправляется...';
    formMessage.className = 'form-message info';

    // Ожидаем ответ, на сервере при ошибке вернется error,
    // при успехе — обновление придет и форму очистим в onmessage.

    // Временно очистим форму (плавно)
    setTimeout(() => {
      inputName.value = '';
      inputRating.value = '';
      inputComment.value = '';
      clearErrors();
      formMessage.textContent = 'Спасибо за отзыв!';
      formMessage.className = 'form-message success';
    }, 500);
  });
})();
