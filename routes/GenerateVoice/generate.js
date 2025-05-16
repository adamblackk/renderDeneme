const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const admin = require('../../config/utils/firebase');
require('dotenv').config();

const router = express.Router();
const bucket = admin.storage().bucket();
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

// Voice ID’ler
const VOICE_IDS = {
  tr: {
    male: '7VqWGAWwo2HMrylfKrcm',
    female: 'xx'
  },
  en: {
    male: 'xx',
    female: 'xx'
  },
  ar: {
    male: 'VOICE_ID_AR_MALE',
    female: 'VOICE_ID_AR_FEMALE'
  }
};

// Dosya adı temizleyici
function slugify(text) {
  return text.toLowerCase().replace(/ /g, '_').replace(/[^\w\-]+/g, '');
}

router.post('/generate', async (req, res) => {
  const { title, content, mainCharacter, lang = 'tr', gender = 'male' } = req.body;

  if (!title || !content || !mainCharacter) {
    return res.status(400).json({ error: 'title, content ve mainCharacter zorunludur.' });
  }

  const voice_id = VOICE_IDS[lang]?.[gender];
  if (!voice_id || voice_id.startsWith('VOICE_ID_')) {
    return res.status(400).json({ error: `Geçersiz voice ID: lang=${lang}, gender=${gender}` });
  }

  const text = `${title}. ${content}`;
  const slugCharacter = slugify(mainCharacter);
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `${slugCharacter}_${dateStamp}.mp3`;
  const localDir = path.join(process.cwd(), 'voices');
  const filePath = path.join(localDir, fileName);

  fs.mkdirSync(localDir, { recursive: true });

  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      data: {
        model_id: 'eleven_multilingual_v2',
        text: text,
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.8
        },
        response_format: 'audio/mpeg',
        output_format: 'mp3_44100_64'
      }
    });

    // Ses dosyasını yerel diske kaydet
    fs.writeFileSync(filePath, response.data);

    // Firebase’e yükle
    const destination = `voices/${lang}/${gender}/${slugCharacter}/${fileName}`;
    await bucket.upload(filePath, {
      destination,
      public: true,
      metadata: { contentType: 'audio/mpeg' }
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Geçici dosyayı sil
    try { fs.unlinkSync(filePath); } catch {}

    res.json({
      message: 'Ses oluşturuldu ve yüklendi.',
      url: publicUrl
    });

  } catch (err) {
    console.error('Hata:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });

    res.status(500).json({
      error: 'Ses oluşturulurken bir hata oluştu.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
