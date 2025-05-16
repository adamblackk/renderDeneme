
const { createLogger, format, transports } = require('winston');
const { v4: uuidv4 } = require('uuid');

//  Winston Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()} - ${message}`)
  ),
  transports: [new transports.Console()],
});

//  Sabitler
const VALID_SPEAKERS = ['john', 'mary'];
const VALID_VOICE_IDS = ['v123', 'v456'];
const VALID_LANGS = ['tr', 'en', 'es'];
const MAX_CONTENT_LENGTH = 1000;
const DEFAULT_RETRIES = 2;

//  Mock database
const dbService = {
    stories: [
      { id: '1', lang: 'tr', title: 'Başlık A', content: 'Bir varmış bir yokmuş...', audioVariants: [] },
      { id: '2', lang: 'en', title: 'Title B', content: 'Once upon a time...', audioVariants: [] },
      { id: '3', lang: 'es', title: 'Título C', content: 'Érase una vez...', audioVariants: [] }
    ],
  
    async findUnprocessedStories(speaker, lang, limit = 5) {
      logger.info(`[DB] Finding ${lang} stories for speaker: ${speaker}`);
      return this.stories
        .filter(
          (story) =>
            story.lang === lang &&
            !story.audioVariants.some((v) => v.speaker === speaker)
        )
        .slice(0, limit);
    },
  
    async updateStory(id, newVariant) {
      logger.info(`[DB] Updating story ${id}`);
      const story = this.stories.find((s) => s.id === id);
      if (!story) throw new Error('Story not found');
      story.audioVariants.push(newVariant);
      logger.info(`[DB] Story ${id} updated successfully`);
    },
  };

//  Mock TTS Servisi
const ttsService = {
  async synthesize(text, voiceId, lang) {
    logger.info(`[TTS] (${lang}) Synthesizing: "${text}" with voiceId: ${voiceId}`);
    if (!text || !voiceId) throw new Error('Invalid TTS input');
    return Buffer.from(`Audio_${lang}: ${text}`);
  },
};

//  Mock Yükleyici
const uploader = {
  async uploadFile(buffer, lang, storyId) {
    logger.info(`[Upload] (${lang}) Uploading audio...`);
    if (!buffer) throw new Error('No audio to upload');
    const url = `https://mock-storage.com/${lang}/audio-${uuidv4()}-${storyId}.mp3`;
    logger.info(`[Upload] Upload complete. URL: ${url}`);
    return url;
  },
};

//  Retry Mekanizması
async function withRetry(fn, maxRetries = DEFAULT_RETRIES, label = 'operation') {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`(${label}) Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      attempt++;
    }
  }
}

//  Ana İşlem 
async function processStories({ speaker, voiceId, lang, limit = 5 }, services = { dbService, ttsService, uploader }) {
  const { dbService, ttsService, uploader } = services;

  logger.info(`Starting for speaker="${speaker}", voiceId="${voiceId}", lang="${lang}", limit=${limit}`);

  if (!VALID_SPEAKERS.includes(speaker)) throw new Error(`Invalid speaker: ${speaker}`);
  if (!VALID_VOICE_IDS.includes(voiceId)) throw new Error(`Invalid voiceId: ${voiceId}`);
  if (!VALID_LANGS.includes(lang)) throw new Error(`Invalid lang: ${lang}`);
  if (limit <= 0) {
    logger.info(`Limit is 0 or less. Skipping processing.`);
    return [];
  }

  const stories = await withRetry(
    () => dbService.findUnprocessedStories(speaker, lang, limit),
    1,
    `DB Find (${lang})`
  );

  if (!stories.length) {
    logger.warn(`No unprocessed stories found for lang=${lang}`);
    return [];
  }

  const results = await Promise.all(
    stories.map(async (story) => {
      const { id, content } = story;
      try {
        if (content.length > MAX_CONTENT_LENGTH) {
          logger.warn(`Story ${id} skipped: content exceeds ${MAX_CONTENT_LENGTH} characters`);
          return { id, success: false, error: 'Content too long' };
        }

        const audio = await withRetry(
          () => ttsService.synthesize(content, voiceId, lang),
          DEFAULT_RETRIES,
          `TTS (${id})`
        );

        const url = await withRetry(
          () => uploader.uploadFile(audio, lang, id),
          DEFAULT_RETRIES,
          `Upload (${id})`
        );

        await withRetry(
          () => dbService.updateStory(id, { speaker, url }),
          DEFAULT_RETRIES,
          `DB Update (${id})`
        );

        logger.info(`Story ${id} processed`);
        return { id, success: true };
      } catch (err) {
        logger.error(`Story ${id} failed: ${err.message}`);
        return { id, success: false, error: err.message };
      }
    })
  );

  logger.info(' Processing complete. Summary:');
  console.table(results);
  return results;
}

//  Örnek Kullanım
(async () => {
  try {
    await processStories({ speaker: 'john', voiceId: 'v123', lang: 'tr', limit: 5 });
  } catch (err) {
    logger.error(` Top-level failure: ${err.message}`);
  }
})();


