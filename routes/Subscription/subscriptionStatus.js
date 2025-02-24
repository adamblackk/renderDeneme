const authenticateToken = require('../../config/utils/authenticateToken');
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const UserfromModel = require('../../config/models/auth');

// Render'da Environment Variable olarak eklediğin Base64 stringi al
const encodedServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

if (!encodedServiceAccount) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT environment variable is not set');
}

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
                    lastVerified: new Date(),
                    subscriptionDetails: {
                        status: 'EXPIRED',
                        paymentStatus: null
                    }
                }
            });
        }

        // 4 saatlik kontrol
        const FOUR_HOURS = 4 * 60 * 60 * 1000;
        const timeSinceLastCheck = user.lastVerified ? Date.now() - user.lastVerified.getTime() : FOUR_HOURS;

        // Son kontrolden 4 saat geçmediyse cache'den döndür
        if (timeSinceLastCheck < FOUR_HOURS) {
            return res.status(200).json({
                success: true,
                message: 'Cached subscription status',
                data: {
                    email: user.email,
                    isPremium: user.isPremium,
                    premiumEnd: user.premiumEnd,
                    autoRenewing: user.autoRenewing,
                    lastVerified: user.lastVerified,
                    subscriptionDetails: user.subscriptionDetails || {
                        status: user.isPremium ? 'ACTIVE' : 'EXPIRED',
                        paymentStatus: user.isPremium ? 'CONFIRMED' : null
                    }
                }
            });
        }

        try {
            const response = await androidPublisher.purchases.subscriptions.get({
                packageName: 'com.storylives.app',
                subscriptionId: user.subscriptionId,
                token: user.purchaseToken
            });

            const now = Date.now();
            const expiryTime = parseInt(response.data.expiryTimeMillis);
            const startTime = parseInt(response.data.startTimeMillis);

            // Abonelik durumu kontrolleri
            const isSubscriptionActive = (
                startTime <= now &&                         // Abonelik başlamış mı?
                expiryTime > now &&                        // Süresi dolmamış mı?
                response.data.cancelReason === 0 &&        // İptal edilmemiş mi?
                response.data.acknowledgementState === 1    // Ödeme onaylanmış mı?
            );

            // Grace Period kontrolü (3 günlük ek süre)
            const GRACE_PERIOD = 3 * 24 * 60 * 60 * 1000;
            const isInGracePeriod = (
                response.data.cancelReason === 2 &&        // Ödeme sorunu var mı?
                (now - expiryTime) < GRACE_PERIOD         // Grace period içinde mi?
            );

            // Abonelik durumunu belirle
            let subscriptionStatus = 'EXPIRED';
            if (isSubscriptionActive) subscriptionStatus = 'ACTIVE';
            else if (isInGracePeriod) subscriptionStatus = 'GRACE_PERIOD';
            else if (response.data.cancelReason > 0) subscriptionStatus = 'CANCELLED';

            // Kullanıcı bilgilerini güncelle
            user.isPremium = isSubscriptionActive || isInGracePeriod;
            user.premiumEnd = new Date(expiryTime);
            user.autoRenewing = response.data.autoRenewing;
            user.lastVerified = new Date();
            
            // Yeni alanları güncelle
            user.subscriptionDetails = {
                status: subscriptionStatus,
                cancelReason: response.data.cancelReason,
                paymentStatus: response.data.acknowledgementState === 1 ? 'CONFIRMED' : 'PENDING',
                gracePeriodEnd: isInGracePeriod ? new Date(expiryTime + GRACE_PERIOD) : null
            };

            // Geçmiş kaydı ekle
            if (user.subscriptionHistory) {
                user.subscriptionHistory.push({
                    action: 'STATUS_CHECK',
                    date: new Date(),
                    details: {
                        status: subscriptionStatus,
                        response: response.data
                    }
                });
            }

            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Refreshed subscription status',
                data: {
                    email: user.email,
                    isPremium: user.isPremium,
                    premiumEnd: user.premiumEnd,
                    autoRenewing: user.autoRenewing,
                    lastVerified: user.lastVerified,
                    subscriptionDetails: {
                        status: subscriptionStatus,
                        cancelReason: response.data.cancelReason,
                        paymentStatus: user.subscriptionDetails.paymentStatus,
                        gracePeriodEnd: user.subscriptionDetails.gracePeriodEnd,
                        priceAmount: response.data.priceAmountMicros / 1000000,
                        currency: response.data.priceCurrencyCode
                    }
                }
            });

        } catch (googleApiError) {
            console.error('Google Play API Error:', googleApiError);
            
            // API hatası durumunda kullanıcı durumunu güncelle
            user.isPremium = false;
            user.lastVerified = new Date();
            user.subscriptionDetails = {
                status: 'ERROR',
                paymentStatus: 'FAILED'
            };
            
            if (user.subscriptionHistory) {
                user.subscriptionHistory.push({
                    action: 'ERROR',
                    date: new Date(),
                    details: {
                        error: googleApiError.message
                    }
                });
            }

            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Subscription verification failed',
                data: {
                    email: user.email,
                    isPremium: false,
                    premiumEnd: null,
                    autoRenewing: false,
                    lastVerified: user.lastVerified,
                    subscriptionDetails: user.subscriptionDetails
                }
            });
        }

    } catch (error) {
        console.error('Abonelik durumu kontrolü hatası:', error);
        return res.status(500).json({
            success: false,
            error: 'Abonelik durumu kontrol edilemedi'
        });
    }
});

module.exports = router;