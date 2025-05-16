// routes/tools/generateBatchAudio.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const admin = require('../../config/utils/firebase');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { Story_tr, Story_en, Story_es } = require('../../config/models/storyModel');
require('dotenv').config();

const router = express.Router();
const bucket = admin.storage().bucket();
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

ffmpeg.setFfmpegPath(ffmpegPath); // 👈 ffmpeg path ayarı

function slugify(text) {
  return text.toLowerCase().replace(/ /g, '_').replace(/[^À-ſa-z0-9_\-]/g, '');
}

router.post('/generate-batch-audio', async (req, res) => {
  const { lang = 'tr', speaker, voiceId, limit = 10 } = req.body;

  if (!speaker || !voiceId) {
    return res.status(400).json({ error: 'speaker ve voiceId alanları zorunludur.' });
  }

  const modelMap = { tr: Story_tr, en: Story_en, es: Story_es };
  const StoryModel = modelMap[lang];

  if (!StoryModel) {
    return res.status(400).json({ error: `Geçersiz lang: ${lang}` });
  }

  try {
    const stories = await StoryModel.find({
      $or: [
        { audioVariants: { $exists: false } },
        { [`audioVariants.speaker`]: { $ne: speaker } }
      ]
    }).limit(limit);

    if (!stories.length) {
      return res.json({ message: 'İşlenecek içerik bulunamadı.' });
    }

    const localDir = path.join(process.cwd(), 'voices');
    fs.mkdirSync(localDir, { recursive: true });

    const results = [];

    for (const story of stories) {
      const { title, content, mainCharacter, _id } = story;
      const text = `${title}. ${content}`;
      const slugCharacter = slugify(mainCharacter);
      const baseFileName = `${slugCharacter}_${speaker}_${Date.now()}`;
      const rawPath = path.join(localDir, `${baseFileName}_raw.mp3`);
      const compressedPath = path.join(localDir, `${baseFileName}_compressed.mp3`);

      try {
        // 1. ElevenLabs API'den ses al (128kbps)
        const response = await axios({
          method: 'POST',
          url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          data: {
            model_id: 'eleven_multilingual_v2',
            text,
            voice_settings: {
              stability: 0.3,
              similarity_boost: 0.8
            },
            response_format: 'audio/mpeg',
            output_format: 'mp3_44100_128'
          }
        });

        fs.writeFileSync(rawPath, response.data);

        // 2. ffmpeg ile sıkıştır (64kbps)
        await new Promise((resolve, reject) => {
          ffmpeg(rawPath)
            .audioBitrate(64)
            .save(compressedPath)
            .on('end', resolve)
            .on('error', reject);
        });

        // 3. Firebase'e yükle
        const destination = `voices/${lang}/${speaker}/${slugCharacter}/${baseFileName}.mp3`;
        await bucket.upload(compressedPath, {
          destination,
          public: true,
          metadata: { contentType: 'audio/mpeg' }
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

        // 4. MongoDB’ye kaydet
        await StoryModel.findByIdAndUpdate(_id, {
          $push: {
            audioVariants: {
              speaker,
              url: publicUrl
            }
          }
        });

        results.push({ _id, speaker, success: true });

        // 5. Geçici dosyaları sil
        try { fs.unlinkSync(rawPath); } catch {}
        try { fs.unlinkSync(compressedPath); } catch {}

      } catch (err) {
        console.error('Hata (storyId:', story._id, '):', err.message);
        results.push({ _id, speaker, success: false, error: err.message });
      }
    }

    res.json({ message: 'İşlem tamamlandı', processed: results });

  } catch (err) {
    console.error('Toplu işlem hatası:', err);
    res.status(500).json({ error: 'Toplu üretim sırasında hata oluştu.' });
  }
});

module.exports = router;
