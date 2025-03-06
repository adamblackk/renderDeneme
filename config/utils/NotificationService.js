const admin = require('./firebase');
const { User } = require('../models/auth');
const { Story_tr, Story_en, Story_es } = require('../models/storyModel');

class NotificationService {
  async sendNotificationByEmail(email) {
    try {
      // Kullanıcıyı bul
      const user = await User.findOne({ email });
      if (!user || !user.fcmToken) {
        throw new Error('User FCM token not found');
      }

      // Dil ayarlarını belirle
      const languageSettings = {
        tr: {
          model: Story_tr,
          title: "📖 Günlük Story Lives",
          actionText: "Hadi Beraber Bakalım"
        },
        en: {
          model: Story_en,
          title: "📖 Daily Story Lives",
          actionText: "Let's Take a Look Together"
        },
        es: {
          model: Story_es,
          title: "📖 Daily Story Lives",
          actionText: "Veamos Juntos"
        }
      };

      // Kullanıcının dil tercihine göre ayarları al
      const settings = languageSettings[user.language] || languageSettings.en;

      // Random içerik seç
      const randomStory = await settings.model.aggregate([
        { $sample: { size: 1 } }
      ]).exec();

      if (!randomStory || randomStory.length === 0) {
        throw new Error('No story found');
      }

      const story = randomStory[0];

      const message = {
        token: user.fcmToken,
        notification: {
          title: settings.title,
          body: `${story.title} | ${settings.actionText}`
        },
        data: {
          storyId: story._id.toString(),
          type: "daily_story",
          language: user.language
        }
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;