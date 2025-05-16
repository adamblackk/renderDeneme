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
        time: '19:30'
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
      
      console.log(`Setting up scheduler for ${language} at ${hour}:${minute} ${config.timezone}`);
      
      cron.schedule(`${minute} ${hour} * * *`, async () => {
        console.log(`🕒 Scheduler triggered for ${language} at ${new Date().toISOString()}`);
        await this.sendNotificationsByTimeZone(language, config);
      }, {
        timezone: config.timezone
      });
    });
  }

  async sendNotificationsByTimeZone(language, config) {
    try {
      console.log(`Starting notifications for ${language}`);
      // Önce tüm kullanıcıları bulalım
      const allUsers = await User.find({});
      
      // FCM token kontrolü
      const usersWithToken = await User.find({ 
        language: language,
        fcmToken: { $exists: true, $ne: null }
      });

      console.log(`Found ${usersWithToken.length} users with FCM tokens for ${language}`);

      // Batch işleme için ayarlar
      const BATCH_SIZE = 100;
      const DELAY_BETWEEN_BATCHES = 1000; // 1 saniye

      // Kullanıcıları batch'lere böl
      for (let i = 0; i < usersWithToken.length; i += BATCH_SIZE) {
        const batch = usersWithToken.slice(i, i + BATCH_SIZE);

        console.log(`Processing batch ${i/BATCH_SIZE + 1} for ${language}`);
        
        await Promise.all(batch.map(async (user) => {
          try {

            console.log(`Attempting to send notification to ${user.email}`);

            await this.notificationService.sendNotificationByEmail(user.email);

            console.log(`✅ Successfully sent notification to ${user.email}`);

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