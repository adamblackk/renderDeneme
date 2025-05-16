
// config/firebase.js
const admin = require('firebase-admin');
require('dotenv').config(); // .env dosyasını yükleyin

try {
    // Environment variable'dan Base64 encoded service account al
    const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!encodedServiceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    // Base64'ten JSON'a decode et
    const buffer = Buffer.from(encodedServiceAccount, 'base64');
    const serviceAccount = JSON.parse(buffer.toString('utf-8'));

    // Firebase admin initialize
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET  //bunu ekledim yeni
    });

    console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
}

module.exports = admin;