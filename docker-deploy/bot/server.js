require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Конфигурация
const PORT = process.env.PORT || 5000;
const AI_API_URL = process.env.AI_API_URL || 'https://v3258578.hosted-by-vdsina.ru';
const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;

// Инициализация SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Создание таблицы incidents
db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    text TEXT,
    photo_url TEXT,
    category TEXT,
    subcategory TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ SQLite database initialized');

// Multer для загрузки фото
const upload = multer({ dest: 'uploads/' });

// ====== ВЕБХУК ОТ MAX ======
app.post('/webhook', async (req, res) => {
  try {
    const { update_type, message } = req.body;
    
    if (update_type !== 'message_created' || !message) {
      return res.json({ ok: true });
    }

    const userId = message.sender?.user_id;
    const text = message.body?.text;
    const attachments = message.attachments || [];
    const photoAttachment = attachments.find(a => a.type === 'image' || a.type === 'photo');
    
    if (!userId) {
      return res.json({ ok: true });
    }

    // Отправляем "Анализирую..."
    await sendMaxMessage(userId, '⏳ Анализирую ваше обращение...');

    let category = null;
    let subcategory = null;

    // Анализ текста
    if (text) {
      try {
        const textResponse = await fetch(`${AI_API_URL}/api/text/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        if (textResponse.ok) {
          const textResult = await textResponse.json();
          category = textResult.category;
          subcategory = textResult.subcategory;
          console.log(`📝 Text analysis: ${category}/${subcategory}`);
        }
      } catch (error) {
        console.error('❌ Text API error:', error.message);
      }
    }

    // Анализ фото
    if (photoAttachment && photoAttachment.url) {
      try {
        // Скачиваем фото
        const photoResponse = await fetch(photoAttachment.url);
        const photoBuffer = await photoResponse.buffer();
        
        // Отправляем в Vision API
        const formData = new FormData();
        formData.append('file', photoBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg'
        });

        const visionResponse = await fetch(`${AI_API_URL}/api/vision/analyze`, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        });

        if (visionResponse.ok) {
          const visionResult = await visionResponse.json();
          // Если текст не дал результат, используем фото
          if (!category && visionResult.category) {
            category = visionResult.category;
            subcategory = visionResult.subcategory;
          }
          console.log(`📷 Vision analysis: ${visionResult.category}/${visionResult.subcategory}`);
        }
      } catch (error) {
        console.error('❌ Vision API error:', error.message);
      }
    }

    // Сохраняем заявку в SQLite
    const stmt = db.prepare(`
      INSERT INTO incidents (user_id, text, photo_url, category, subcategory)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      text || null,
      photoAttachment?.url || null,
      category || 'unknown',
      subcategory || null
    );

    const incidentId = result.lastInsertRowid;

    // Отправляем ответ пользователю
    const categoryName = category || 'не определена';
    const responseText = category 
      ? `✅ Заявка #${incidentId} создана!\n\nКатегория: ${categoryName}\nОжидайте мастера.`
      : `⚠️ Заявка #${incidentId} создана, но не удалось определить категорию.\n\nДиспетчер рассмотрит её вручную.`;

    await sendMaxMessage(userId, responseText);

    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.json({ ok: true }); // Всегда возвращаем ok, чтобы MAX не ретраил
  }
});

// ====== API ДЛЯ МИНИ-ПРИЛОЖЕНИЯ ======

// Получить список заявок
app.get('/api/incidents', (req, res) => {
  try {
    const incidents = db.prepare(`
      SELECT * FROM incidents 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();
    
    res.json(incidents);
  } catch (error) {
    console.error('❌ GET /api/incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Получить заявки конкретного пользователя
app.get('/api/incidents/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const incidents = db.prepare(`
      SELECT * FROM incidents 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);
    
    res.json(incidents);
  } catch (error) {
    console.error('❌ GET /api/incidents/user error:', error);
    res.status(500).json({ error: 'Failed to fetch user incidents' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'sqlite',
    incidents_count: db.prepare('SELECT COUNT(*) as count FROM incidents').get().count
  });
});

// ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======

async function sendMaxMessage(userId, text) {
  if (!MAX_BOT_TOKEN) {
    console.log(`📤 [MOCK] Message to ${userId}: ${text}`);
    return;
  }

  try {
    await fetch('https://botapi.max.ru/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAX_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: userId,
        text: text
      })
    });
  } catch (error) {
    console.error('❌ Failed to send MAX message:', error.message);
  }
}

// ====== ЗАПУСК СЕРВЕРА ======

app.listen(PORT, () => {
  console.log(`🤖 Bot server running on port ${PORT}`);
  console.log(`📡 AI API: ${AI_API_URL}`);
  console.log(`🔑 MAX Bot Token: ${MAX_BOT_TOKEN ? 'configured' : 'NOT SET (mock mode)'}`);
  console.log(`💾 SQLite database: ${dbPath}`);
});
