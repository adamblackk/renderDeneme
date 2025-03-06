// services/schedulerService.js
const cron = require('node-cron');
const NotificationService = require('./NotificationService');
const { User } = require('../models/auth');

class SchedulerService {
  constructor() {
    this.notificationService = new NotificationService();

    this.timeSlots = {
      tr: {
        timezone: 'Europe/Istanbul',
        time: '20:00'
      },
      en: {
        timezone: 'America/New_York',
        time: '19:00'
      },
      es: {
        timezone: 'Europe/Madrid',
        time: '21:00'
      }
    };

    this.initializeSchedulers();
  }

  initializeSchedulers() {
    Object.entries(this.timeSlots).forEach(([language, config]) => {
      const [hour, minute] = config.time.split(':');
      
      cron.schedule(`${minute} ${hour} * * *`, async () => {
        await this.sendNotificationsByTimeZone(language, config);
      }, {
        timezone: config.timezone
      });
    });
  }

  async sendNotificationsByTimeZone(language, config) {
    try {
      // Önce tüm kullanıcıları bulalım
      const allUsers = await User.find({});
      
      // FCM token kontrolü
      const usersWithToken = await User.find({ 
        language: language,
        fcmToken: { $exists: true, $ne: null }
      });


      // Batch işleme için ayarlar
      const BATCH_SIZE = 100;
      const DELAY_BETWEEN_BATCHES = 1000; // 1 saniye

      // Kullanıcıları batch'lere böl
      for (let i = 0; i < usersWithToken.length; i += BATCH_SIZE) {
        const batch = usersWithToken.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (user) => {
          try {
            await this.notificationService.sendNotificationByEmail(user.email);
          } catch (error) {
            console.error(`❌ Failed to send notification to ${user.email}:`, error);
          }
        }));

        // Batch'ler arası bekle
        if (i + BATCH_SIZE < usersWithToken.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

    } catch (error) {
      console.error(`🚨 Critical error in scheduler for ${language}:`, error);
    }
  }
}

module.exports = SchedulerService;