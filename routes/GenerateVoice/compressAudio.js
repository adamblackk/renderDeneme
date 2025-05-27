const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: 'uploads/' });

router.post('/compress-audio', upload.single('audio'), async (req, res) => {
  try {
    const inputPath = req.file.path;

    // voices klasörü oluşturulmazsa oluştur
    const voicesDir = path.join(process.cwd(), 'voices');
    fs.mkdirSync(voicesDir, { recursive: true });

    const baseFileName = path.parse(req.file.originalname).name.replace(/\s+/g, '_') + `_compressed_${Date.now()}.mp3`;
    const outputPath = path.join(voicesDir, baseFileName);

    ffmpeg(inputPath)
      .audioBitrate(64) // sıkıştırma kalitesi
      .audioCodec('libmp3lame')
      .on('end', () => {
        fs.unlinkSync(inputPath); // geçici yüklenen dosyayı sil
        res.json({
          message: '✔ Dosya sıkıştırıldı ve voices/ klasörüne kaydedildi.',
          file: baseFileName,
          localPath: `voices/${baseFileName}`
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg Hatası:', err);
        res.status(500).json({ error: 'Sıkıştırma başarısız' });
      })
      .save(outputPath);

  } catch (err) {
    console.error('Sunucu Hatası:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
