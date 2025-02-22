const authenticateToken = require('../../config/utils/authenticateToken');
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const UserfromModel = require('../../config/models/auth');

// Render'da Environment Variable olarak eklediğin Base64 stringi al
const encodedServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

// Base64 stringini JSON formatına decode et
const buffer = Buffer.from(encodedServiceAccount, 'base64');
const serviceAccount = JSON.parse(buffer.toString('utf-8'));

// Google Auth'u `credentials` ile başlat (keyFile yerine)
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
    },
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
});


// Android Publisher API'yi yapılandır
const androidPublisher = google.androidpublisher({
    version: 'v3',
    auth
});

router.post('/subscription-status', authenticateToken, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email bilgisi gerekli'
            });
        }

        // Kullanıcıyı bul
        const user = await UserfromModel.User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Kullanıcı bulunamadı'
            });
        }

        // Aktif abonelik kontrolü
        if (!user.purchaseToken || !user.subscriptionId) {
            return res.status(200).json({  
                success: true,             
                message: 'Aktif abonelik bulunamadı',
                data: {
                    email: user.email,
                    isPremium: false,
                    premiumEnd: null,
                    autoRenewing: false,
                    lastVerified: new Date()
                }
            });
        }

        // Kontrol aralığı (4 saat)
        const SIX_HOURS = 4 * 60 * 60 * 1000;
        const timeSinceLastCheck = user.lastVerified ? Date.now() - user.lastVerified.getTime() : SIX_HOURS;

        // Son kontrolden 6 saat geçmediyse cache'den döndür
        if (timeSinceLastCheck < SIX_HOURS) {
            return res.status(200).json({
                success: true,
                message: 'Cached subscription status',
                data: {
                    email: user.email,
                    isPremium: user.isPremium,
                    premiumEnd: user.premiumEnd,
                    autoRenewing: user.autoRenewing,
                    lastVerified: user.lastVerified
                }
            });
        }

        // 6 saat geçmişse Google Play'den kontrol et
        const response = await androidPublisher.purchases.subscriptions.get({
            packageName: 'com.storylives.app',
            subscriptionId: user.subscriptionId,
            token: user.purchaseToken
        });

        // Kullanıcı bilgilerini güncelle
        user.isPremium = true;
        user.premiumEnd = new Date(parseInt(response.data.expiryTimeMillis));
        user.autoRenewing = response.data.autoRenewing;
        user.lastVerified = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Fresh subscription status',
            data: {
                email: user.email,
                isPremium: user.isPremium,
                premiumEnd: user.premiumEnd,
                autoRenewing: user.autoRenewing,
                lastVerified: user.lastVerified
            }
        });

    } catch (error) {
        console.error('Abonelik durumu kontrolü hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Abonelik durumu kontrol edilemedi'
        });
    }
});

module.exports = router;