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

router.post('/subscription-webhook', async (req, res) => {
    try {
        console.log('Webhook payload:', req.body);

        const { 
            notificationType,
            purchaseToken,
            subscriptionId,
            packageName
        } = req.body;

        // Package name kontrolü
        if (packageName !== 'com.storylives.app') {
            console.error('Invalid package name:', packageName);
            return res.status(400).json({ error: 'Invalid package name' });
        }

        // Kullanıcıyı bul
        const user = await UserfromModel.User.findOne({ purchaseToken });

        if (!user) {
            console.error('Webhook: User not found for purchaseToken:', purchaseToken);
            return res.status(404).json({ error: 'User not found' });
        }

        // Google Play'den güncel bilgileri al
        const response = await androidPublisher.purchases.subscriptions.get({
            packageName: 'com.storylives.app',
            subscriptionId: subscriptionId,
            token: purchaseToken
        });

        // Bildirim tipine göre işlem yap
        switch (notificationType) {
            case 'SUBSCRIPTION_RENEWED':
                user.isPremium = true;
                user.premiumEnd = new Date(parseInt(response.data.expiryTimeMillis));
                user.autoRenewing = response.data.autoRenewing;
                console.log('Subscription renewed for user:', user.email);
                break;

            case 'SUBSCRIPTION_CANCELED':
                const expiryTime = parseInt(response.data.expiryTimeMillis);
                const now = Date.now();

                if (expiryTime > now) {
                    // Dönem sonu iptali
                    user.isPremium = true;
                    user.autoRenewing = false;
                    user.premiumEnd = new Date(expiryTime);
                    console.log('Subscription will end at:', new Date(expiryTime));
                } else {
                    // Anında iptal
                    user.isPremium = false;
                    user.autoRenewing = false;
                    user.premiumEnd = new Date();
                    console.log('Subscription ended immediately');
                }
                break;

            case 'SUBSCRIPTION_PURCHASED':
                user.isPremium = true;
                user.premiumEnd = new Date(parseInt(response.data.expiryTimeMillis));
                user.autoRenewing = response.data.autoRenewing;
                console.log('New subscription purchased for user:', user.email);
                break;

            case 'SUBSCRIPTION_ON_HOLD':
                user.isPremium = false;
                console.log('Subscription on hold for user:', user.email);
                break;

            case 'SUBSCRIPTION_IN_GRACE_PERIOD':
                user.isPremium = true;
                console.log('Subscription in grace period for user:', user.email);
                break;

            default:
                console.log('Unknown notification type:', notificationType);
        }

        user.lastVerified = new Date();
        await user.save();

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;