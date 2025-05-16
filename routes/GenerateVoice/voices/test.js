const { checkSubscriptionStatus, withRetry, withTimeout, delay, userDb, googleService } = require('./checkSubscriptionStatusDeneme');

jest.mock('./checkSubscriptionStatusDeneme', () => ({
  ...jest.requireActual('./checkSubscriptionStatusDeneme'),
  delay: jest.fn(),
}));

describe('checkSubscriptionStatus', () => {
  const email = 'active@example.com';
  const userDbFindUserByEmail = jest.spyOn(userDb, 'findUserByEmail');
  const userDbSaveUser = jest.spyOn(userDb, 'saveUser');
  const googleServiceGetSubscriptionStatus = jest.spyOn(googleService, 'getSubscriptionStatus');
  const consoleWarnSpy = jest.spyOn(console, 'warn');

  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2024-01-01').getTime());
    userDbFindUserByEmail.mockReset();
    userDbSaveUser.mockReset();
    googleServiceGetSubscriptionStatus.mockReset();
    consoleWarnSpy.mockReset();
    rateLimitCounter = 0;
    userDbSaveUser.mockResolvedValue(undefined);
    delay.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Input validation', () => {
    it('throws an error if email is missing', async () => {
      await expect(checkSubscriptionStatus(null, { userDb, googleService })).rejects.toThrow('Email is required');
    });

    it('throws an error if user is not found', async () => {
      userDbFindUserByEmail.mockResolvedValue(null);
      await expect(checkSubscriptionStatus(email, { userDb, googleService })).rejects.toThrow('User not found');
    });

    it('throws an error if purchaseToken is missing or not a string', async () => {
      userDbFindUserByEmail.mockResolvedValue({ email, subscriptionId: 'sub-active', purchaseToken: null });
      await expect(checkSubscriptionStatus(email, { userDb, googleService })).rejects.toThrow('Missing or invalid purchase token');

      userDbFindUserByEmail.mockResolvedValue({ email, subscriptionId: 'sub-active', purchaseToken: 123 });
      await expect(checkSubscriptionStatus(email, { userDb, googleService })).rejects.toThrow('Missing or invalid purchase token');
    });

    it('throws an error if subscriptionId is missing or not a string', async () => {
      userDbFindUserByEmail.mockResolvedValue({ email, subscriptionId: null, purchaseToken: 'token-active' });
      await expect(checkSubscriptionStatus(email, { userDb, googleService })).rejects.toThrow('Missing or invalid subscription ID');

      userDbFindUserByEmail.mockResolvedValue({ email, subscriptionId: 123, purchaseToken: 'token-active' });
      await expect(checkSubscriptionStatus(email, { userDb, googleService })).rejects.toThrow('Missing or invalid subscription ID');
    });
  });

  describe('Caching', () => {
    it('returns cached results if lastVerified is recent', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-cached',
        purchaseToken: 'token-cached',
        isPremium: true,
        autoRenewing: true,
        lastVerified: new Date(Date.now() - 2 * 60 * 1000),
        subscriptionDetails: { status: 'ACTIVE' },
      });

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: true,
        status: 'ACTIVE',
        autoRenewing: true,
        lastVerified: expect.any(Date),
      });
      expect(googleServiceGetSubscriptionStatus).not.toHaveBeenCalled();
    });
  });

  describe('Subscription status', () => {
    it('returns ACTIVE for a valid, non-expired subscription', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-active',
        purchaseToken: 'token-active',
        lastVerified: new Date(Date.now() - 10 * 60 * 1000),
      });
      googleServiceGetSubscriptionStatus.mockResolvedValue({
        startTimeMillis: Date.now() - 1000000,
        expiryTimeMillis: Date.now() + 1000000,
        cancelReason: 0,
        acknowledgementState: 1,
        autoRenewing: true,
        priceAmountMicros: 9990000,
        priceCurrencyCode: 'USD',
      });

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: true,
        status: 'ACTIVE',
        autoRenewing: true,
        lastVerified: expect.any(Date),
        premiumEnd: expect.any(Date),
        priceAmount: 9.99,
        currency: 'USD',
      });
      expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
        isPremium: true,
        subscriptionDetails: {
        status: 'ACTIVE',
        cancelReason: 0,
        paymentStatus: 'CONFIRMED',
        gracePeriodEnd: null,
       priceAmount: 9.99,
       currency: 'USD',
       },
    }));
    });

    it('returns GRACE_PERIOD when within the 3-day extension window', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-grace',
        purchaseToken: 'token-grace',
        lastVerified: new Date(Date.now() - 10 * 60 * 1000),
      });
      googleServiceGetSubscriptionStatus.mockResolvedValue({
        startTimeMillis: Date.now() - 1000000,
        expiryTimeMillis: Date.now() - 1 * 24 * 60 * 60 * 1000,
        cancelReason: 2,
        acknowledgementState: 1,
        autoRenewing: false,
        priceAmountMicros: 5990000,
        priceCurrencyCode: 'USD',
      });

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: true,
        status: 'GRACE_PERIOD',
        autoRenewing: false,
        lastVerified: expect.any(Date),
        premiumEnd: expect.any(Date),
        priceAmount: 5.99,
        currency: 'USD',
      });
      expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
        isPremium: true,
        subscriptionDetails: {
        status: 'GRACE_PERIOD',
        cancelReason: 2,
        paymentStatus: 'CONFIRMED',
        gracePeriodEnd: expect.any(Date), // Grace Period bitiş tarihi kontrolü
        priceAmount: 5.99,
        currency: 'USD',
      },
    }));
    });

    it('returns CANCELLED if the subscription ended early', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-cancel',
        purchaseToken: 'token-cancel',
        lastVerified: new Date(Date.now() - 10 * 60 * 1000),
      });
      googleServiceGetSubscriptionStatus.mockResolvedValue({
        startTimeMillis: Date.now() - 1000000,
        expiryTimeMillis: Date.now() - 1 * 24 * 60 * 60 * 1000,
        cancelReason: 1,
        acknowledgementState: 1,
        autoRenewing: false,
        priceAmountMicros: 4990000,
        priceCurrencyCode: 'USD',
      });

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: false,
        status: 'CANCELLED',
        autoRenewing: false,
        lastVerified: expect.any(Date),
        premiumEnd: expect.any(Date),
        priceAmount: 4.99,
        currency: 'USD',
      });
      expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
        isPremium: false,
        subscriptionDetails: {
        status: 'CANCELLED',
        cancelReason: 1,
        paymentStatus: 'CONFIRMED',
        gracePeriodEnd: null,
        priceAmount: 4.99,
        currency: 'USD',
      },
    }));

    });

    it('returns EXPIRED if cancelReason is undefined', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-expired',
        purchaseToken: 'token-expired',
        lastVerified: new Date(Date.now() - 10 * 60 * 1000),
      });
      googleServiceGetSubscriptionStatus.mockResolvedValue({
        startTimeMillis: Date.now() - 1000000,
        expiryTimeMillis: Date.now() - 1 * 24 * 60 * 60 * 1000,
        acknowledgementState: 1,
        autoRenewing: false,
        priceAmountMicros: 4990000,
        priceCurrencyCode: 'USD',
      });

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: false,
        status: 'EXPIRED',
        autoRenewing: false,
        lastVerified: expect.any(Date),
        premiumEnd: expect.any(Date),
        priceAmount: 4.99,
        currency: 'USD',
      });
      expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
        isPremium: false,
        subscriptionDetails: {
        status: 'EXPIRED',
        cancelReason: undefined,
        paymentStatus: 'CONFIRMED',
        gracePeriodEnd: null,
        priceAmount: 4.99,
        currency: 'USD',
      },
    }));
    });
  });

  describe('Error handling', () => {
    it('returns ERROR after all retry attempts fail', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-error',
        purchaseToken: 'token-error',
        lastVerified: new Date(Date.now() - 10 * 60 * 1000),
      });
      googleServiceGetSubscriptionStatus.mockRejectedValue(new Error('Google API failed'));

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: false,
        status: 'ERROR',
        autoRenewing: false,
        lastVerified: expect.any(Date),
      });
      expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
        isPremium: false,
        subscriptionDetails: {
          status: 'ERROR',
          paymentStatus: 'FAILED',
        },
      }));
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });

    it('returns ERROR if every attempt times out', async () => {
        userDbFindUserByEmail.mockResolvedValue({
          email,
          subscriptionId: 'sub-timeout',
          purchaseToken: 'token-timeout',
          lastVerified: new Date(Date.now() - 10 * 60 * 1000),
        });
      
        googleServiceGetSubscriptionStatus.mockImplementation(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout exceeded')), 4000))
        );
      
        const promise = checkSubscriptionStatus(email, { userDb, googleService });
      
        // Zamanı ilerletiyoruz ve microtask kuyruğunu boşaltıyoruz
        for (let i = 0; i < 3; i++) {
          jest.advanceTimersByTime(4000);
          await Promise.resolve(); // Microtasks işlesin
        }
      
        const result = await promise;
      
        expect(result).toEqual({
          email,
          isPremium: false,
          status: 'ERROR',
          autoRenewing: false,
          lastVerified: expect.any(Date),
        });
      
        expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
          isPremium: false,
          subscriptionDetails: {
            status: 'ERROR',
            paymentStatus: 'FAILED',
          },
        }));
      
        expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('(Google API) Attempt 1 failed'));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('(Google API) Attempt 2 failed'));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('(Google API) Attempt 3 failed'));
      }, 15000); // Süreyi biraz daha uzun tut.
      

    it('succeeds after failing twice due to rate limiting', async () => {
      userDbFindUserByEmail.mockResolvedValue({
        email,
        subscriptionId: 'sub-rate-limit',
        purchaseToken: 'token-limit',
        lastVerified: new Date(Date.now() - 10 * 60 * 1000),
      });
      googleServiceGetSubscriptionStatus.mockImplementation(() => {
        if (rateLimitCounter < 2) {
          rateLimitCounter++;
          throw new Error('Rate limit exceeded');
        }
        return Promise.resolve({
          startTimeMillis: Date.now() - 1000000,
          expiryTimeMillis: Date.now() + 1000000,
          cancelReason: 0,
          acknowledgementState: 1,
          autoRenewing: true,
          priceAmountMicros: 8990000,
          priceCurrencyCode: 'USD',
        });
      });

      const result = await checkSubscriptionStatus(email, { userDb, googleService });
      expect(result).toEqual({
        email,
        isPremium: true,
        status: 'ACTIVE',
        autoRenewing: true,
        lastVerified: expect.any(Date),
        premiumEnd: expect.any(Date),
        priceAmount: 8.99,
        currency: 'USD',
      });
      expect(userDbSaveUser).toHaveBeenCalledWith(expect.objectContaining({
        isPremium: true,
        subscriptionDetails: {
          status: 'ACTIVE',
          cancelReason: 0,
          paymentStatus: 'CONFIRMED',
          gracePeriodEnd: null,
          priceAmount: 8.99,
          currency: 'USD',
        },
      }));
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });
  });
});