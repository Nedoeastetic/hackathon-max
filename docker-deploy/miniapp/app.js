// Конфигурация
const API_BASE_URL = '/api'; // Nginx проксирует на backend
let currentUserId = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Пытаемся получить userId из MAX initData
  initMaxInitData();
  
  // Настраиваем табы
  setupTabs();
  
  // Настраиваем форму
  setupForm();
  
  // Настраиваем превью фото
  setupPhotoPreview();
  
  // Настраиваем кнопку симуляции
  setupSimulateButton();
  
  // Загружаем заявки при переключении на вкладку списка
  document.querySelector('[data-tab="list"]').addEventListener('click', loadIncidents);
});

// Инициализация MAX initData
function initMaxInitData() {
  // В реальном MAX initData передаётся через URL параметры
  const urlParams = new URLSearchParams(window.location.search);
  const initData = urlParams.get('initData');
  
  if (initData) {
    try {
      // Парсим initData (в реальности это JSON с подписью)
      const params = new URLSearchParams(initData);
      const user = params.get('user');
      if (user) {
        const userData = JSON.parse(user);
        currentUserId = userData.id;
        console.log('✅ MAX user initialized:', currentUserId);
      }
    } catch (error) {
      console.error('❌ Failed to parse MAX initData:', error);
    }
  } else {
    console.log('⚠️ No MAX initData found, using simulation mode');
  }
}

// Настройка табов
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Убираем active у всех табов
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Добавляем active к выбранному табу
      tab.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });
}

// Настройка формы
function setupForm() {
  const form = document.getElementById('incident-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = document.getElementById('text').value.trim();
    const photoInput = document.getElementById('photo');
    const photo = photoInput.files[0];
    
    if (!text && !photo) {
      showError('Пожалуйста, опишите проблему или прикрепите фото');
      return;
    }
    
    if (!currentUserId) {
      showError('Не удалось определить пользователя. Нажмите "Симулировать MAX initData"');
      return;
    }
    
    await submitIncident(text, photo);
  });
}

// Настройка превью фото
function setupPhotoPreview() {
  const photoInput = document.getElementById('photo');
  const preview = document.getElementById('photo-preview');
  
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });
}

// Настройка кнопки симуляции
function setupSimulateButton() {
  const button = document.getElementById('simulate-max');
  
  button.addEventListener('click', () => {
    // Генерируем фейковый userId
    currentUserId = `user_${Date.now()}`;
    console.log('🎭 Simulated MAX user:', currentUserId);
    
    // Показываем уведомление
    showSuccess(`Симулирован пользователь: ${currentUserId}`);
    
    // Скрываем кнопку после симуляции
    button.style.display = 'none';
  });
}

// Отправка заявки
async function submitIncident(text, photo) {
  const submitBtn = document.querySelector('#incident-form .btn-primary');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  // Показываем loader
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  
  try {
    const formData = new FormData();
    formData.append('user_id', currentUserId);
    if (text) formData.append('text', text);
    if (photo) formData.append('photo', photo);
    
    const response = await fetch(`${API_BASE_URL}/incidents`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to create incident');
    }
    
    const result = await response.json();
    
    // Показываем успех
    showSuccess(`✅ Заявка #${result.id} создана! Категория: ${result.category || 'не определена'}`);
    
    // Очищаем форму
    document.getElementById('incident-form').reset();
    document.getElementById('photo-preview').innerHTML = '';
    
    // Переключаемся на вкладку списка
    setTimeout(() => {
      document.querySelector('[data-tab="list"]').click();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Failed to submit incident:', error);
    showError('Ошибка при создании заявки. Попробуйте ещё раз.');
  } finally {
    // Убираем loader
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
}

// Загрузка списка заявок
async function loadIncidents() {
  const listContainer = document.getElementById('incidents-list');
  listContainer.innerHTML = '<div class="loading">Загрузка заявок...</div>';
  
  try {
    const url = currentUserId 
      ? `${API_BASE_URL}/incidents/user/${currentUserId}`
      : `${API_BASE_URL}/incidents`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch incidents');
    }
    
    const incidents = await response.json();
    
    if (incidents.length === 0) {
      listContainer.innerHTML = '<div class="empty">У вас пока нет заявок</div>';
      return;
    }
    
    listContainer.innerHTML = incidents.map(incident => `
      <div class="incident-card">
        <div class="incident-header">
          <span class="incident-id">#${incident.id}</span>
          <span class="incident-status ${incident.status}">${getStatusText(incident.status)}</span>
        </div>
        <div class="incident-text">${escapeHtml(incident.text || 'Без описания')}</div>
        ${incident.category ? `<div class="incident-category">Категория: ${incident.category}</div>` : ''}
        ${incident.photo_url ? `<div class="incident-photo"><img src="${incident.photo_url}" alt="Photo"></div>` : ''}
        <div class="incident-date">${formatDate(incident.created_at)}</div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('❌ Failed to load incidents:', error);
    listContainer.innerHTML = '<div class="empty">Ошибка загрузки заявок</div>';
  }
}

// Вспомогательные функции
function getStatusText(status) {
  const statuses = {
    'new': 'Новая',
    'in-progress': 'В работе',
    'resolved': 'Выполнена'
  };
  return statuses[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccess(message) {
  const existing = document.querySelector('.success-message');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.className = 'success-message';
  div.textContent = message;
  
  const form = document.getElementById('incident-form');
  form.insertBefore(div, form.firstChild);
  
  setTimeout(() => div.remove(), 5000);
}

function showError(message) {
  const existing = document.querySelector('.error-message');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.className = 'error-message';
  div.textContent = message;
  
  const form = document.getElementById('incident-form');
  form.insertBefore(div, form.firstChild);
  
  setTimeout(() => div.remove(), 5000);
}
