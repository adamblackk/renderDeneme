
const delay = (ms) => new Promise((res) => setTimeout(res, ms));


function withTimeout(promise, timeoutMs = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout exceeded')), timeoutMs)
    )
  ]);
}


async function withRetry(fn, maxRetries = 2, label = 'operation') {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`(${label}) Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      attempt++;
    }
  }
}


const MAX_CACHE_AGE_MS = 5 * 60 * 1000;
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

async function checkSubscriptionStatus(email, { userDb, googleService }) {
  if (!email) throw new Error('Email is required');
  const user = await userDb.findUserByEmail(email);
  if (!user) throw new Error('User not found');

  if (!user.purchaseToken || typeof user.purchaseToken !== 'string') {
    throw new Error('Missing or invalid purchase token');
  }
  
  if (!user.subscriptionId || typeof user.subscriptionId !== 'string') {
    throw new Error('Missing or invalid subscription ID');
  }
  


  const now = Date.now();
  const lastCheck = user.lastVerified ? user.lastVerified.getTime() : 0;
  if (now - lastCheck < MAX_CACHE_AGE_MS) {
    return {
      email,
      isPremium: user.isPremium,
      status: user.subscriptionDetails?.status || 'CACHED',
      autoRenewing: user.autoRenewing,
      lastVerified: user.lastVerified
    };
  }

  try {
    const res = await withRetry(
      () => withTimeout(
        googleService.getSubscriptionStatus(user.subscriptionId, user.purchaseToken),
        3000
      ),
      2,
      'Google API'
    );

    const expiry = parseInt(res.expiryTimeMillis);
    const start = parseInt(res.startTimeMillis);

    const isActive = (
      start <= now &&
      expiry > now &&
      res.cancelReason === 0 &&
      res.acknowledgementState === 1
    );

    const isInGrace = (
      res.cancelReason === 2 &&
      now - expiry < GRACE_PERIOD_MS
    );

    let status = 'EXPIRED';
    if (isActive) status = 'ACTIVE';
    else if (isInGrace) status = 'GRACE_PERIOD';
    else if (res.cancelReason > 0) status = 'CANCELLED';

    user.isPremium = isActive || isInGrace;
    user.premiumEnd = new Date(expiry);
    user.autoRenewing = res.autoRenewing;
    user.lastVerified = new Date();
    user.subscriptionDetails = {
      status,
      cancelReason: res.cancelReason,
      paymentStatus: res.acknowledgementState === 1 ? 'CONFIRMED' : 'PENDING',
      gracePeriodEnd: isInGrace ? new Date(expiry + GRACE_PERIOD_MS) : null,
      priceAmount: res.priceAmountMicros / 1_000_000,
      currency: res.priceCurrencyCode
    };

    if (user.subscriptionHistory) {
      user.subscriptionHistory.push({
        action: 'STATUS_CHECK',
        date: new Date(),
        details: { status, response: res }
      });
    }

    await userDb.saveUser(user);

    return {
      email,
      isPremium: user.isPremium,
      status,
      autoRenewing: user.autoRenewing,
      lastVerified: user.lastVerified,
      premiumEnd: user.premiumEnd,
      priceAmount: user.subscriptionDetails.priceAmount,
      currency: user.subscriptionDetails.currency
    };

  } catch (err) {
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
        details: { error: err.message }
      });
    }

    await userDb.saveUser(user);

    return {
      email,
      isPremium: false,
      status: 'ERROR',
      autoRenewing: false,
      lastVerified: user.lastVerified
    };
  }
}

// Mocks
const now = Date.now();
let rateLimitCounter = 0;

const userDb = {
  findUserByEmail: async (email) => {
    const base = {
      isPremium: false,
      autoRenewing: false,
      lastVerified: new Date(now - 10 * 60 * 1000),
      subscriptionDetails: {},
      subscriptionHistory: []
    };

    switch (email) {
      case 'timeout@example.com':
        return { email, subscriptionId: 'sub-timeout', purchaseToken: 'token-timeout', ...base };
      case 'error@example.com':
        return { email, subscriptionId: 'sub-error', purchaseToken: 'token-error', ...base };
      case 'ratelimit@example.com':
        return { email, subscriptionId: 'sub-rate-limit', purchaseToken: 'token-limit', ...base };
      case 'grace@example.com':
        return { email, subscriptionId: 'sub-grace', purchaseToken: 'token-grace', ...base };
      case 'cancelled@example.com':
        return { email, subscriptionId: 'sub-cancel', purchaseToken: 'token-cancel', ...base };
      case 'active@example.com':
        return { email, subscriptionId: 'sub-active', purchaseToken: 'token-active', ...base };
      case 'no-sub@example.com':
        return { email, subscriptionId: null, purchaseToken: null, ...base };
      case 'cached@example.com':
        return {
          email,
          subscriptionId: 'sub-cached',
          purchaseToken: 'token-cached',
          isPremium: true,
          autoRenewing: true,
          lastVerified: new Date(now - 2 * 60 * 1000),
          subscriptionDetails: { status: 'ACTIVE' }
        };
      default:
        return null;
    }
  },
  saveUser: async (user) => {
    console.log(`User saved: ${user.email}`);
  }
};

const googleService = {
  getSubscriptionStatus: async (subId, token) => {
    if (subId === 'sub-timeout') {
      await delay(4000);
    }
    if (subId === 'sub-rate-limit') {
      rateLimitCounter++;
      if (rateLimitCounter <= 2) {
        throw new Error('Rate limit exceeded');
      }
    }
    if (subId === 'sub-error') {
      throw new Error('Google API failed');
    }

    const configs = {
      'sub-active': { cancelReason: 0, acknowledgementState: 1, autoRenewing: true, price: 9990000 },
      'sub-grace': { cancelReason: 2, acknowledgementState: 1, autoRenewing: false, price: 5990000, expired: true },
      'sub-cancel': { cancelReason: 1, acknowledgementState: 1, autoRenewing: false, price: 4990000, expired: true },
      'sub-rate-limit': { cancelReason: 0, acknowledgementState: 1, autoRenewing: false, price: 8990000 },
      'sub-timeout': { cancelReason: 0, acknowledgementState: 1, autoRenewing: false, price: 7990000 },
    };

    const c = configs[subId];
    const expiry = c.expired ? now - 1 * 24 * 60 * 60 * 1000 : now + 1000000;
    return {
      startTimeMillis: now - 1000000,
      expiryTimeMillis: expiry,
      cancelReason: c.cancelReason,
      acknowledgementState: c.acknowledgementState,
      autoRenewing: c.autoRenewing,
      priceAmountMicros: c.price,
      priceCurrencyCode: 'USD'
    };
  }
};

 
module.exports = {
  checkSubscriptionStatus,
  withRetry,
  withTimeout,
  userDb,
  googleService
};
