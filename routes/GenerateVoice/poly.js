const express = require('express');
const fs = require('fs');
const path = require('path');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
require('dotenv').config();

const router = express.Router();

const client = new PollyClient({
  region: 'us-east-1', // Neural seslerin daha yaygın olduğu bölge
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

router.get('/polly-en', async (req, res) => {
  const text = req.query.text || `<speak>
  <break time="500ms"/> 
  <emphasis level="strong">She stood</emphasis> at the edge of the world,  
  watching the sun <emphasis level="moderate">disappear</emphasis> beneath the ocean’s horizon.  
  <break time="300ms"/>  
  The wind whispered through her hair... carrying <emphasis level="reduced">memories</emphasis> she had tried so hard to forget.
</speak>
`
  const voiceId = req.query.voice || 'Matthew'; // Diğer örnekler: 'Matthew', 'Justin'
  const filename = `polly_en_${Date.now()}.mp3`;
  const filePath = path.join(__dirname, filename);

  const command = new SynthesizeSpeechCommand({
    OutputFormat: 'mp3',
    Engine: 'standard', // NEURAL ses gerektiği için bu satır önemli!
    Text: text,
    TextType:"ssml",
    VoiceId: voiceId,
    LanguageCode: 'en-US'
  });

  try {
    const response = await client.send(command);
    const writeStream = fs.createWriteStream(filePath);
    response.AudioStream.pipe(writeStream);

    writeStream.on('finish', () => {
      res.download(filePath, filename, () => {
        fs.unlink(filePath, () => {});
      });
    });
  } catch (err) {
    console.error('Polly Hatası:', err.message);
    res.status(500).json({ error: 'Polly’den ses alınamadı.' });
  }
});

module.exports = router;
