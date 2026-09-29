const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = 3001;
const ML_API_URL = 'https://v3258578.hosted-by-vdsina.ru';

// Отключаем SSL проверку
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Прокси для Vision API
app.post('/api/vision/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await fetch(`${ML_API_URL}/api/vision/analyze`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Vision proxy error:', error);
    res.status(500).json({ error: 'Vision analysis failed' });
  }
});

// Прокси для Text API
app.post('/api/text/analyze', async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/api/text/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Text proxy error:', error);
    res.status(500).json({ error: 'Text analysis failed' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/api/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding to ML API: ${ML_API_URL}`);
});
