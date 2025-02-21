
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

router.post('/verifySubscription', authenticateToken, async (req, res) => {

    try {
        const {
            email,
            purchaseToken,
            subscriptionId,
            orderId
        } = req.body;

        if (!email || !purchaseToken || !subscriptionId || !orderId) {
            return res.status(400).json({
                success: false,
                error: 'Gerekli alanlar eksik'
            });
        }

        // Google Play'den abonelik doğrulaması
        try {
            console.log('Google Play doğrulama başlıyor:', {
                packageName: 'com.storylives.app',
                subscriptionId,
                token: purchaseToken
            });

            const response = await androidPublisher.purchases.subscriptions.get({
                packageName: 'com.storylives.app',
                subscriptionId: subscriptionId,
                token: purchaseToken
            });

            console.log('Google Play yanıtı:', response.data);

            // acknowledgementState = 0 ise onayla
            if (response.data.acknowledgementState === 0) {
                await androidPublisher.purchases.subscriptions.acknowledge({
                    packageName: 'com.storylives.app',
                    subscriptionId: subscriptionId,
                    token: purchaseToken,
                    requestBody: {
                        developerPayload: 'custom-string'
                    }
                });
                console.log('Abonelik başarıyla onaylandı.');
            }

            // Kullanıcıyı bul
            const user = await UserfromModel.User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Kullanıcı bulunamadı'
                });
            }

            // Abonelik süresini belirle
            const premiumEndDate = new Date(parseInt(response.data.expiryTimeMillis));

            // Kullanıcı bilgilerini güncelle
            user.isPremium = true;
            user.premiumStart = new Date();
            user.premiumEnd = premiumEndDate;
            user.purchaseToken = purchaseToken;
            user.subscriptionId = subscriptionId;
            user.orderId = orderId;
            user.autoRenewing = response.data.autoRenewing;
            user.lastVerified = new Date();

            await user.save();
            console.log('Kullanıcı güncellendi:', user.email);

            res.status(200).json({
                success: true,
                message: 'Abonelik başarıyla doğrulandı',
                data: {
                    email: user.email,
                    isPremium: user.isPremium,
                    premiumEnd: user.premiumEnd,
                    subscriptionId: user.subscriptionId,
                    autoRenewing: user.autoRenewing
                }
            });

        } catch (googleError) {
            console.error('Google Play doğrulama detaylı hata:', {
                message: googleError.message,
                code: googleError.code,
                details: googleError.response?.data
            });
            return res.status(400).json({
                success: false,
                error: 'Google Play doğrulaması başarısız',
                details: googleError.message
            });
        }

    } catch (error) {
        console.error('Genel hata:', error);
        res.status(500).json({
            success: false,
            error: 'Abonelik doğrulama sırasında bir hata oluştu'
        });
    }
});


module.exports = router; 
