const { checkSubscriptionStatus } = require('./checkSubscriptionStatusDeneme');
const { userDb } = require('./checkSubscriptionStatusDeneme')
const { googleService } = require('./checkSubscriptionStatusDeneme')

const delay = (ms) => new Promise(res => setTimeout(res, ms));
let rateLimitCounter = 0;
const now = Date.now();

/* // 🔧 Mock DB ve Google Service
const userDb = {
  findUserByEmail: async (email) => {
    switch (email) {
      case 'missing@example.com':
        return null;

        case 'timeout@example.com':
  return {
    email,
    subscriptionId: 'sub-timeout',
    purchaseToken: 'token-timeout',
    isPremium: false,
    autoRenewing: false,
    lastVerified: new Date(now - 10 * 60 * 1000),
    subscriptionDetails: {},
    subscriptionHistory: []
  };

  case 'ratelimit@example.com':
  return {
    email,
    subscriptionId: 'sub-rate-limit',
    purchaseToken: 'token-limit',
    isPremium: false,
    autoRenewing: false,
    lastVerified: new Date(now - 10 * 60 * 1000),
    subscriptionDetails: {},
    subscriptionHistory: []
  };


      case 'no-sub@example.com': 
        return {
          email,
          subscriptionId: null,
          purchaseToken: null,
          isPremium: false,
          autoRenewing: false,
          lastVerified: new Date(now - 10 * 60 * 1000),
          subscriptionDetails: {}
        };

      case 'cached@example.com':
        return {
          email,
          subscriptionId: 'sub-cached',
          purchaseToken: 'token-cached',
          isPremium: true,
          autoRenewing: true,
          lastVerified: new Date(now - 2 * 60 * 1000), // 2 dakika önce
          subscriptionDetails: { status: 'ACTIVE' }
        };

      case 'active@example.com':
        return {
          email,
          subscriptionId: 'sub-active',
          purchaseToken: 'token-active',
          isPremium: false,
          autoRenewing: false,
          lastVerified: new Date(now - 10 * 60 * 1000),
          subscriptionDetails: {},
          subscriptionHistory: []
        };

      case 'grace@example.com':
        return {
          email,
          subscriptionId: 'sub-grace',
          purchaseToken: 'token-grace',
          isPremium: false,
          autoRenewing: false,
          lastVerified: new Date(now - 10 * 60 * 1000),
          subscriptionDetails: {},
          subscriptionHistory: []
        };

      case 'cancelled@example.com':
        return {
          email,
          subscriptionId: 'sub-cancel',
          purchaseToken: 'token-cancel',
          isPremium: false,
          autoRenewing: false,
          lastVerified: new Date(now - 10 * 60 * 1000),
          subscriptionDetails: {},
          subscriptionHistory: []
        };

      case 'error@example.com':
        return {
          email,
          subscriptionId: 'sub-error',
          purchaseToken: 'token-error',
          isPremium: false,
          autoRenewing: false,
          lastVerified: new Date(now - 10 * 60 * 1000),
          subscriptionDetails: {},
          subscriptionHistory: []
        };

      default:
        return null;
    }
  },
  saveUser: async (user) => {
    console.log(`📝 User saved: ${user.email}`);
  }
};

const googleService = {
  getSubscriptionStatus: async (subId, token) => {


if (subId === 'sub-rate-limit') {
  rateLimitCounter++;
  if (rateLimitCounter <= 2) {
    throw new Error('Rate limit exceeded'); // 🔁 Retry için trigger
  }
  return {
    startTimeMillis: now - 1000000,
    expiryTimeMillis: now + 1000000,
    cancelReason: 0,
    acknowledgementState: 1,
    autoRenewing: false,
    priceAmountMicros: 8990000,
    priceCurrencyCode: 'USD'
  };
}


    if (subId === 'sub-timeout') {
        await delay(4000); // 4 saniye beklet → timeout tetiklenir
        return {
          startTimeMillis: now - 1000000,
          expiryTimeMillis: now + 1000000,
          cancelReason: 0,
          acknowledgementState: 1,
          autoRenewing: false,
          priceAmountMicros: 7990000,
          priceCurrencyCode: 'USD'
        };
      }
      
    if (subId === 'sub-active') {
      return {
        startTimeMillis: now - 1000000,
        expiryTimeMillis: now + 1000000,
        cancelReason: 0,
        acknowledgementState: 1,
        autoRenewing: true,
        priceAmountMicros: 9990000,
        priceCurrencyCode: 'USD'
      };
    }

    if (subId === 'sub-grace') {
      return {
        startTimeMillis: now - 5 * 24 * 60 * 60 * 1000,
        expiryTimeMillis: now - 1 * 24 * 60 * 60 * 1000,
        cancelReason: 2,
        acknowledgementState: 1,
        autoRenewing: false,
        priceAmountMicros: 5990000,
        priceCurrencyCode: 'USD'
      };
    }

    if (subId === 'sub-cancel') {
      return {
        startTimeMillis: now - 10 * 24 * 60 * 60 * 1000,
        expiryTimeMillis: now - 5 * 24 * 60 * 60 * 1000,
        cancelReason: 1,
        acknowledgementState: 1,
        autoRenewing: false,
        priceAmountMicros: 4990000,
        priceCurrencyCode: 'USD'
      };
    }

    if (subId === 'sub-cached') {
      return {
        // should not be called!
      };
    }

    throw new Error('Google API failed');
  }
}; */

// 🧪 Test Çalıştırıcı
const testEmails = [
  { email: null, label: '🚫 Missing email (should throw)' },
  { email: 'missing@example.com', label: '❌ User not found' },
  { email: 'no-sub@example.com', label: '⚪ No subscription info' },
  { email: 'cached@example.com', label: '🟡 Cached result' },
  { email: 'active@example.com', label: '🟢 Active subscription' },
  { email: 'grace@example.com', label: '🟠 Grace period' },
  { email: 'cancelled@example.com', label: '🔴 Cancelled subscription' },
  { email: 'error@example.com', label: '❌ Google API failure' },
  { email: 'timeout@example.com', label: '⌛ Timeout failure' },
  { email: 'ratelimit@example.com', label: '📈 Rate limit recovery' }
];

(async () => {
  for (const { email, label } of testEmails) {
    console.log(`\n=== ${label} ===`);
    try {
      const result = await checkSubscriptionStatus(email, {
        userDb,
        googleService
      });
      console.log(result);
    } catch (err) {
      console.error('💥 Error:', err.message);
    }
  }
})();



