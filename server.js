const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { MongoClient } = require('mongodb');
const axios = require('axios');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3008;

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// MongoDB connection
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
let db;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'commercial-platform' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Commercial Platform Core Systems - Enhanced with SMUGGLER'S UNIVERSE Smuggling
class CommercialPlatform {
  constructor() {
    this.marketplace = new MarketplaceManager();
    this.payments = new PaymentProcessor();
    this.subscriptions = new SubscriptionManager();
    this.analytics = new CommercialAnalytics();
    this.userAcquisition = new UserAcquisitionManager();
    this.revenue = new RevenueManager();

    // SMUGGLER'S UNIVERSE Smuggling Integration - Sprint 5
    this.smuggling = new SmugglingManager();
    this.cargoSystem = new CargoManager();
    this.jobBoard = new JobBoardManager();
    this.blackMarket = new BlackMarketManager();
    this.tradeRoutes = new TradeRouteManager();
    this.loreIntegration = null; // Will connect to lore database
  }

  async initialize() {
    await this.initializeLoreIntegration();
    await this.smuggling.initialize();
    await this.cargoSystem.initialize();
    await this.jobBoard.initialize();
    await this.blackMarket.initialize();
    await this.tradeRoutes.initialize();

    logger.info('Commercial Platform initialized with SMUGGLER\'S UNIVERSE smuggling mechanics');
  }

  async initializeLoreIntegration() {
    try {
      // Connect to lore database for authentic cargo types and jobs
      this.loreIntegration = {
        baseUrl: process.env.LORE_DATABASE_URL || 'http://localhost:3012',
        apiKey: process.env.LORE_API_KEY
      };

      // Test connection
      const response = await fetch(`${this.loreIntegration.baseUrl}/health`);
      if (response.ok) {
        logger.info('Commercial Platform connected to lore database');
      }
    } catch (error) {
      logger.warn('Lore database connection failed for commercial platform:', error.message);
      this.loreIntegration = null;
    }
  }
}

class MarketplaceManager {
  constructor() {
    this.listings = new Map();
    this.transactions = [];
    this.categories = {
      cosmetics: { basePrice: 4.99, royalty: 0.3 },
      equipment: { basePrice: 9.99, royalty: 0.25 },
      boosts: { basePrice: 2.99, royalty: 0.4 },
      bundles: { basePrice: 19.99, royalty: 0.2 },
      premium: { basePrice: 49.99, royalty: 0.15 }
    };
  }

  createListing(listingData) {
    const listing = {
      id: uuidv4(),
      ...listingData,
      status: 'active',
      createdAt: new Date(),
      views: 0,
      purchases: 0,
      revenue: 0
    };
    this.listings.set(listing.id, listing);
    return listing;
  }

  purchaseListing(listingId, buyerId, paymentMethod) {
    const listing = this.listings.get(listingId);
    if (!listing) throw new Error('Listing not found');

    const transaction = {
      id: uuidv4(),
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      amount: listing.price,
      currency: 'USD',
      paymentMethod,
      status: 'completed',
      timestamp: new Date(),
      royalty: listing.price * this.categories[listing.category].royalty
    };

    this.transactions.push(transaction);
    listing.purchases++;
    listing.revenue += transaction.amount;

    return transaction;
  }

  getMarketAnalytics() {
    const categoryStats = {};
    const totalRevenue = this.transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = this.transactions.length;

    Object.keys(this.categories).forEach(category => {
      const categoryListings = Array.from(this.listings.values()).filter(l => l.category === category);
      const categoryTransactions = this.transactions.filter(t => {
        const listing = this.listings.get(t.listingId);
        return listing && listing.category === category;
      });

      categoryStats[category] = {
        listings: categoryListings.length,
        transactions: categoryTransactions.length,
        revenue: categoryTransactions.reduce((sum, t) => sum + t.amount, 0),
        averagePrice: categoryListings.length > 0 ?
          categoryListings.reduce((sum, l) => sum + l.price, 0) / categoryListings.length : 0
      };
    });

    return {
      totalRevenue,
      totalTransactions,
      categoryStats,
      topListings: Array.from(this.listings.values())
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 10)
    };
  }
}

class PaymentProcessor {
  constructor() {
    this.transactions = [];
    this.supportedMethods = ['stripe', 'paypal', 'crypto', 'gift_card'];
  }

  async processPayment(amount, currency, paymentMethod, paymentData) {
    // Simulate payment processing
    const transaction = {
      id: uuidv4(),
      amount,
      currency,
      method: paymentMethod,
      status: 'processing',
      timestamp: new Date(),
      ...paymentData
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    transaction.status = Math.random() > 0.05 ? 'completed' : 'failed';
    this.transactions.push(transaction);

    return transaction;
  }

  refundTransaction(transactionId, reason) {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (!transaction) throw new Error('Transaction not found');

    const refund = {
      id: uuidv4(),
      originalTransactionId: transactionId,
      amount: transaction.amount,
      reason,
      status: 'completed',
      timestamp: new Date()
    };

    transaction.refund = refund;
    return refund;
  }
}

class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.plans = {
      basic: { price: 4.99, features: ['basic_access', 'community'], period: 'monthly' },
      premium: { price: 9.99, features: ['premium_access', 'early_access', 'customization'], period: 'monthly' },
      vip: { price: 19.99, features: ['vip_access', 'exclusive_content', 'priority_support'], period: 'monthly' },
      lifetime: { price: 99.99, features: ['lifetime_access', 'all_features', 'beta_access'], period: 'lifetime' }
    };
  }

  createSubscription(userId, planId, paymentMethod) {
    const plan = this.plans[planId];
    if (!plan) throw new Error('Invalid plan');

    const subscription = {
      id: uuidv4(),
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethod,
      features: plan.features,
      revenue: plan.price
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  cancelSubscription(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    return subscription;
  }

  getSubscriptionAnalytics() {
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.status === 'active');

    const revenueByPlan = {};
    Object.keys(this.plans).forEach(planId => {
      revenueByPlan[planId] = activeSubscriptions
        .filter(s => s.planId === planId)
        .reduce((sum, s) => sum + s.revenue, 0);
    });

    return {
      totalActive: activeSubscriptions.length,
      totalRevenue: activeSubscriptions.reduce((sum, s) => sum + s.revenue, 0),
      revenueByPlan,
      churnRate: 0.05, // Mock data
      averageRevenuePerUser: activeSubscriptions.length > 0 ?
        activeSubscriptions.reduce((sum, s) => sum + s.revenue, 0) / activeSubscriptions.length : 0
    };
  }
}

class CommercialAnalytics {
  constructor() {
    this.metrics = {
      revenue: { total: 0, monthly: {}, bySource: {} },
      users: { total: 0, active: 0, paying: 0, demographics: {} },
      engagement: { sessionDuration: 0, retention: {}, churn: {} },
      market: { competitors: [], trends: {}, opportunities: [] },
      acquisition: { channels: {}, campaigns: {}, costs: {} }
    };
  }

  updateMetric(category, subcategory, value) {
    if (!this.metrics[category]) this.metrics[category] = {};
    if (!this.metrics[category][subcategory]) this.metrics[category][subcategory] = {};

    this.metrics[category][subcategory] = value;
  }

  getDashboardData() {
    return {
      summary: {
        totalRevenue: this.metrics.revenue.total,
        monthlyRevenue: this.metrics.revenue.monthly,
        totalUsers: this.metrics.users.total,
        activeUsers: this.metrics.users.active,
        payingUsers: this.metrics.users.paying,
        customerAcquisitionCost: this.calculateCAC(),
        lifetimeValue: this.calculateLTV(),
        churnRate: this.metrics.engagement.churn.monthly || 0.05
      },
      charts: {
        revenue: this.metrics.revenue.monthly,
        userGrowth: this.metrics.users.demographics,
        engagement: this.metrics.engagement.retention,
        acquisition: this.metrics.acquisition.channels
      },
      kpis: {
        arpu: this.calculateARPU(),
        conversionRate: this.calculateConversionRate(),
        retentionRate: this.calculateRetentionRate(),
        roi: this.calculateROI()
      }
    };
  }

  calculateCAC() {
    const totalAcquisitionCost = Object.values(this.metrics.acquisition.costs).reduce((a, b) => a + b, 0);
    return this.metrics.users.total > 0 ? totalAcquisitionCost / this.metrics.users.total : 0;
  }

  calculateLTV() {
    return this.metrics.revenue.total / Math.max(this.metrics.users.paying, 1);
  }

  calculateARPU() {
    return this.metrics.users.total > 0 ? this.metrics.revenue.total / this.metrics.users.total : 0;
  }

  calculateConversionRate() {
    return this.metrics.users.total > 0 ? this.metrics.users.paying / this.metrics.users.total : 0;
  }

  calculateRetentionRate() {
    return 1 - (this.metrics.engagement.churn.monthly || 0.05);
  }

  calculateROI() {
    const totalInvestment = Object.values(this.metrics.acquisition.costs).reduce((a, b) => a + b, 0);
    return totalInvestment > 0 ? (this.metrics.revenue.total - totalInvestment) / totalInvestment : 0;
  }
}

class UserAcquisitionManager {
  constructor() {
    this.campaigns = new Map();
    this.channels = {
      social_media: { costPerAcquisition: 2.50, conversionRate: 0.03 },
      google_ads: { costPerAcquisition: 5.00, conversionRate: 0.02 },
      influencers: { costPerAcquisition: 8.00, conversionRate: 0.04 },
      content_marketing: { costPerAcquisition: 1.50, conversionRate: 0.015 },
      referrals: { costPerAcquisition: 0.50, conversionRate: 0.08 },
      partnerships: { costPerAcquisition: 3.00, conversionRate: 0.025 }
    };
  }

  createCampaign(campaignData) {
    const campaign = {
      id: uuidv4(),
      ...campaignData,
      status: 'active',
      createdAt: new Date(),
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0
      }
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  trackAcquisitionEvent(campaignId, eventType, data) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    switch (eventType) {
      case 'impression':
        campaign.metrics.impressions++;
        break;
      case 'click':
        campaign.metrics.clicks++;
        break;
      case 'conversion':
        campaign.metrics.conversions++;
        campaign.metrics.cost += data.cost || 0;
        break;
    }
  }

  getAcquisitionAnalytics() {
    const campaigns = Array.from(this.campaigns.values());
    const channelPerformance = {};

    Object.keys(this.channels).forEach(channel => {
      const channelCampaigns = campaigns.filter(c => c.channel === channel);
      channelPerformance[channel] = {
        campaigns: channelCampaigns.length,
        totalCost: channelCampaigns.reduce((sum, c) => sum + c.metrics.cost, 0),
        totalConversions: channelCampaigns.reduce((sum, c) => sum + c.metrics.conversions, 0),
        averageCPA: channelCampaigns.length > 0 ?
          channelCampaigns.reduce((sum, c) => sum + c.metrics.cost, 0) / channelCampaigns.length : 0
      };
    });

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
      totalSpent: campaigns.reduce((sum, c) => sum + c.metrics.cost, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0),
      channelPerformance,
      bestPerformingChannel: Object.entries(channelPerformance)
        .sort(([,a], [,b]) => b.totalConversions - a.totalConversions)[0]?.[0]
    };
  }
}

class RevenueManager {
  constructor() {
    this.streams = {
      subscriptions: 0,
      marketplace: 0,
      ads: 0,
      partnerships: 0,
      merchandise: 0
    };
    this.predictions = {};
    this.goals = {
      monthly: 50000,
      quarterly: 150000,
      yearly: 600000
    };
  }

  updateRevenue(stream, amount) {
    this.streams[stream] += amount;
  }

  predictRevenue(period) {
    // Simple linear regression based on historical data
    const historicalData = this.getHistoricalRevenue();
    if (historicalData.length < 3) return null;

    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, d, i) => sum + i, 0);
    const sumY = historicalData.reduce((sum, d) => sum + d, 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + d * i, 0);
    const sumXX = historicalData.reduce((sum, d, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextPeriod = n;
    return Math.max(0, slope * nextPeriod + intercept);
  }

  getRevenueBreakdown() {
    const total = Object.values(this.streams).reduce((a, b) => a + b, 0);
    const breakdown = {};

    Object.entries(this.streams).forEach(([stream, amount]) => {
      breakdown[stream] = {
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      };
    });

    return {
      total,
      breakdown,
      growth: this.calculateGrowthRate(),
      goals: this.checkGoalsProgress()
    };
  }

  calculateGrowthRate() {
    // Mock growth calculation
    return 0.15; // 15% month-over-month growth
  }

  checkGoalsProgress() {
    const total = Object.values(this.streams).reduce((a, b) => a + b, 0);
    return {
      monthly: { current: total, target: this.goals.monthly, progress: (total / this.goals.monthly) * 100 },
      quarterly: { current: total * 3, target: this.goals.quarterly, progress: ((total * 3) / this.goals.quarterly) * 100 },
      yearly: { current: total * 12, target: this.goals.yearly, progress: ((total * 12) / this.goals.yearly) * 100 }
    };
  }

  getHistoricalRevenue() {
    // Mock historical data
    return [35000, 42000, 48000, 52000, 58000];
  }
}

// Initialize commercial platform
const commercialPlatform = new CommercialPlatform();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'commercial_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'commercial-platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    systems: {
      marketplace: 'operational',
      payments: 'operational',
      subscriptions: 'operational',
      analytics: 'operational',
      userAcquisition: 'operational'
    }
  });
});

// Marketplace API
app.post('/api/marketplace/listings', authenticateToken, async (req, res) => {
  try {
    const listing = commercialPlatform.marketplace.createListing({
      ...req.body,
      sellerId: req.user.id
    });
    res.json({ success: true, data: listing });
  } catch (error) {
    logger.error('Create listing error:', error.message);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

app.get('/api/marketplace/listings', (req, res) => {
  const listings = Array.from(commercialPlatform.marketplace.listings.values())
    .filter(l => l.status === 'active');
  res.json({ success: true, data: listings });
});

app.post('/api/marketplace/purchase/:listingId', authenticateToken, async (req, res) => {
  try {
    const { paymentMethod, paymentData } = req.body;
    const transaction = await commercialPlatform.marketplace.purchaseListing(
      req.params.listingId,
      req.user.id,
      paymentMethod
    );

    // Process payment
    const payment = await commercialPlatform.payments.processPayment(
      transaction.amount,
      'USD',
      paymentMethod,
      { ...paymentData, transactionId: transaction.id }
    );

    res.json({ success: true, data: { transaction, payment } });
  } catch (error) {
    logger.error('Purchase error:', error.message);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// Payment API
app.post('/api/payments/process', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, method, data } = req.body;
    const payment = await commercialPlatform.payments.processPayment(amount, currency, method, data);
    res.json({ success: true, data: payment });
  } catch (error) {
    logger.error('Payment processing error:', error.message);
    res.status(500).json({ error: 'Payment failed' });
  }
});

app.post('/api/payments/refund/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const refund = commercialPlatform.payments.refundTransaction(req.params.transactionId, reason);
    res.json({ success: true, data: refund });
  } catch (error) {
    logger.error('Refund error:', error.message);
    res.status(500).json({ error: 'Refund failed' });
  }
});

// Subscription API
app.post('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    const subscription = commercialPlatform.subscriptions.createSubscription(
      req.user.id,
      planId,
      paymentMethod
    );
    res.json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Subscription creation error:', error.message);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

app.delete('/api/subscriptions/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const subscription = commercialPlatform.subscriptions.cancelSubscription(req.params.subscriptionId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    logger.error('Subscription cancellation error:', error.message);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

app.get('/api/subscriptions/analytics', authenticateToken, (req, res) => {
  const analytics = commercialPlatform.subscriptions.getSubscriptionAnalytics();
  res.json({ success: true, data: analytics });
});

// User Acquisition API
app.post('/api/acquisition/campaigns', authenticateToken, async (req, res) => {
  try {
    const campaign = commercialPlatform.userAcquisition.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Campaign creation error:', error.message);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

app.post('/api/acquisition/track/:campaignId', async (req, res) => {
  try {
    const { eventType, data } = req.body;
    commercialPlatform.userAcquisition.trackAcquisitionEvent(req.params.campaignId, eventType, data);
    res.json({ success: true });
  } catch (error) {
    logger.error('Tracking error:', error.message);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// Analytics API
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  const dashboard = commercialPlatform.analytics.getDashboardData();
  res.json({ success: true, data: dashboard });
});

app.get('/api/analytics/marketplace', authenticateToken, (req, res) => {
  const analytics = commercialPlatform.marketplace.getMarketAnalytics();
  res.json({ success: true, data: analytics });
});

app.get('/api/analytics/acquisition', authenticateToken, (req, res) => {
  const analytics = commercialPlatform.userAcquisition.getAcquisitionAnalytics();
  res.json({ success: true, data: analytics });
});

app.get('/api/analytics/revenue', authenticateToken, (req, res) => {
  const analytics = commercialPlatform.revenue.getRevenueBreakdown();
  res.json({ success: true, data: analytics });
});

app.post('/api/analytics/update', authenticateToken, (req, res) => {
  try {
    const { category, subcategory, value } = req.body;
    commercialPlatform.analytics.updateMetric(category, subcategory, value);
    res.json({ success: true });
  } catch (error) {
    logger.error('Analytics update error:', error.message);
    res.status(500).json({ error: 'Failed to update analytics' });
  }
});

// Legacy routes for backward compatibility
app.get('/revenue', (req, res) => {
  res.json(commercialPlatform.analytics.metrics.revenue);
});

app.get('/users', (req, res) => {
  res.json(commercialPlatform.analytics.metrics.users);
});

app.get('/dashboard', (req, res) => {
  res.json(commercialPlatform.analytics.getDashboardData());
});

// Database connection and initialization
async function initializeDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db('smugglers-commercial');
    logger.info('Connected to MongoDB');

    // Initialize collections
    await db.collection('marketplace').createIndex({ category: 1, status: 1 });
    await db.collection('transactions').createIndex({ timestamp: -1 });
    await db.collection('subscriptions').createIndex({ userId: 1, status: 1 });
    await db.collection('campaigns').createIndex({ status: 1, channel: 1 });

  } catch (error) {
    logger.error('Database connection error:', error.message);
  }
}

// Automated commercial updates
cron.schedule('0 */4 * * *', () => { // Every 4 hours
  logger.info('Running automated commercial platform update...');

  try {
    // Simulate marketplace activity
    const categories = Object.keys(commercialPlatform.marketplace.categories);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    const listing = commercialPlatform.marketplace.createListing({
      name: `Random ${randomCategory} Item`,
      description: `Auto-generated ${randomCategory} item`,
      price: commercialPlatform.marketplace.categories[randomCategory].basePrice * (0.8 + Math.random() * 0.4),
      category: randomCategory,
      sellerId: `system_${Date.now()}`
    });

    // Simulate purchases
    if (Math.random() > 0.6) {
      const buyerId = `user_${Math.floor(Math.random() * 10000)}`;
      commercialPlatform.marketplace.purchaseListing(listing.id, buyerId, 'stripe');
      commercialPlatform.revenue.updateRevenue('marketplace', listing.price);
    }

    // Simulate subscription signups
    if (Math.random() > 0.8) {
      const plans = Object.keys(commercialPlatform.subscriptions.plans);
      const randomPlan = plans[Math.floor(Math.random() * plans.length)];
      commercialPlatform.subscriptions.createSubscription(
        `user_${Math.floor(Math.random() * 10000)}`,
        randomPlan,
        'stripe'
      );
      commercialPlatform.revenue.updateRevenue('subscriptions',
        commercialPlatform.subscriptions.plans[randomPlan].price);
    }

    // Update analytics
    commercialPlatform.analytics.updateMetric('revenue', 'total',
      Object.values(commercialPlatform.revenue.streams).reduce((a, b) => a + b, 0));

    commercialPlatform.analytics.updateMetric('users', 'total',
      commercialPlatform.analytics.metrics.users.total + Math.floor(Math.random() * 5));

    logger.info(`Commercial update completed - Revenue: $${commercialPlatform.analytics.metrics.revenue.total.toFixed(2)}`);

  } catch (error) {
    logger.error('Commercial update error:', error.message);
  }
});

// Daily business intelligence report
cron.schedule('0 9 * * *', () => { // 9 AM daily
  logger.info('Generating daily business intelligence report...');

  const dashboard = commercialPlatform.analytics.getDashboardData();
  const marketplace = commercialPlatform.marketplace.getMarketAnalytics();
  const subscriptions = commercialPlatform.subscriptions.getSubscriptionAnalytics();
  const acquisition = commercialPlatform.userAcquisition.getAcquisitionAnalytics();
  const revenue = commercialPlatform.revenue.getRevenueBreakdown();

  const report = {
    date: new Date().toISOString().split('T')[0],
    summary: dashboard.summary,
    marketplace,
    subscriptions,
    acquisition,
    revenue,
    recommendations: generateRecommendations(dashboard, marketplace, revenue)
  };

  // Store report (in production, this would go to a database or be emailed)
  logger.info('Daily BI Report:', JSON.stringify(report, null, 2));
});

function generateRecommendations(dashboard, marketplace, revenue) {
  const recommendations = [];

  if (dashboard.summary.churnRate > 0.1) {
    recommendations.push('High churn rate detected - consider retention campaigns');
  }

  if (dashboard.kpis.roi < 1.0) {
    recommendations.push('ROI below target - review acquisition costs');
  }

  if (marketplace.categoryStats.cosmetics?.transactions < 10) {
    recommendations.push('Low cosmetics sales - consider promotional campaigns');
  }

  if (revenue.breakdown.subscriptions.percentage < 40) {
    recommendations.push('Subscription revenue below target - focus on conversion');
  }

  return recommendations;
}

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// SMUGGLER'S UNIVERSE Smuggling Systems - Sprint 5
class SmugglingManager {
  constructor() {
    this.activeRuns = new Map();
    this.completedRuns = [];
    this.smugglingStats = {
      totalRuns: 0,
      successfulRuns: 0,
      interceptedRuns: 0,
      totalValue: 0
    };
    this.riskLevels = {
      low: { interceptionChance: 0.05, rewardMultiplier: 1.2 },
      medium: { interceptionChance: 0.15, rewardMultiplier: 1.8 },
      high: { interceptionChance: 0.30, rewardMultiplier: 2.5 },
      extreme: { interceptionChance: 0.50, rewardMultiplier: 4.0 }
    };
  }

  async initialize() {
    // Load smuggling data from lore
    await this.loadSmugglingData();
    // Start smuggling simulation
    this.startSmugglingSimulation();
    logger.info('Smuggling Manager initialized');
  }

  async loadSmugglingData() {
    if (commercialPlatform.loreIntegration) {
      try {
        const response = await axios.get(`${commercialPlatform.loreIntegration.baseUrl}/api/lore/smuggling`);
        const smugglingData = response.data.data;
        // Process and store smuggling lore
        this.smugglingLore = smugglingData;
      } catch (error) {
        logger.debug('Failed to load smuggling lore:', error.message);
        this.smugglingLore = this.getFallbackSmugglingLore();
      }
    } else {
      this.smugglingLore = this.getFallbackSmugglingLore();
    }
  }

  getFallbackSmugglingLore() {
    return {
      techniques: [
        'Void-jumping through uncharted space',
        'Hollowed asteroids for cargo concealment',
        'False transponder signals',
        'Crew impersonation',
        'Bribe networks'
      ],
      risks: [
        'Authority patrols',
        'Pirate interception',
        'System malfunctions',
        'Cargo instability',
        'Informant betrayal'
      ],
      rewards: [
        'High profit margins',
        'Rare cargo access',
        'Faction reputation',
        'Trade route monopolies'
      ]
    };
  }

  startSmugglingSimulation() {
    // Simulate background smuggling activity
    setInterval(() => {
      this.simulateSmugglingActivity();
    }, 300000); // Every 5 minutes
  }

  async simulateSmugglingActivity() {
    // Random smuggling runs happening in the universe
    if (Math.random() < 0.3) { // 30% chance every 5 minutes
      const run = this.generateRandomSmugglingRun();
      this.activeRuns.set(run.id, run);

      // Simulate run completion after random time
      setTimeout(() => {
        this.completeSmugglingRun(run.id);
      }, Math.random() * 600000 + 300000); // 5-15 minutes
    }
  }

  generateRandomSmugglingRun() {
    const cargoTypes = ['luxury_goods', 'technology', 'weapons', 'narcotics', 'artifacts'];
    const origins = ['Neo-Vegas', 'Corporate Core', 'Outer Rim', 'Scavenger Belt'];
    const destinations = ['Free Port', 'Black Market Hub', 'Smuggler\'s Haven'];

    const run = {
      id: uuidv4(),
      captain: `Captain ${['Jax', 'Nova', 'Rex', 'Luna', 'Drake'][Math.floor(Math.random() * 5)]}`,
      cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
      origin: origins[Math.floor(Math.random() * origins.length)],
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      value: Math.floor(Math.random() * 50000) + 10000,
      risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      startedAt: Date.now()
    };

    return run;
  }

  completeSmugglingRun(runId) {
    const run = this.activeRuns.get(runId);
    if (!run) return;

    const riskLevel = this.riskLevels[run.risk];
    const success = Math.random() > riskLevel.interceptionChance;

    if (success) {
      run.success = true;
      run.reward = Math.floor(run.value * riskLevel.rewardMultiplier);
      this.smugglingStats.successfulRuns++;
    } else {
      run.success = false;
      run.intercepted = true;
      this.smugglingStats.interceptedRuns++;
    }

    run.completedAt = Date.now();
    this.completedRuns.push(run);
    this.activeRuns.delete(runId);
    this.smugglingStats.totalRuns++;
    this.smugglingStats.totalValue += run.value;

    // Keep only recent runs
    if (this.completedRuns.length > 100) {
      this.completedRuns = this.completedRuns.slice(-50);
    }
  }

  getSmugglingStats() {
    return {
      ...this.smugglingStats,
      successRate: this.smugglingStats.totalRuns > 0 ?
        (this.smugglingStats.successfulRuns / this.smugglingStats.totalRuns) * 100 : 0,
      activeRuns: Array.from(this.activeRuns.values()),
      recentRuns: this.completedRuns.slice(-10)
    };
  }
}

class CargoManager {
  constructor() {
    this.cargoTypes = new Map();
    this.cargoManifests = new Map();
    this.cargoStats = {
      totalCargo: 0,
      totalValue: 0,
      contrabandValue: 0
    };
  }

  async initialize() {
    await this.loadCargoTypes();
    logger.info('Cargo Manager initialized with SMUGGLER\'S UNIVERSE cargo types');
  }

  async loadCargoTypes() {
    if (commercialPlatform.loreIntegration) {
      try {
        const response = await axios.get(`${commercialPlatform.loreIntegration.baseUrl}/api/lore/cargo`);
        const cargoData = response.data.data;
        cargoData.forEach(cargo => {
          this.cargoTypes.set(cargo.id, cargo);
        });
      } catch (error) {
        logger.debug('Failed to load cargo types from lore:', error.message);
      }
    }

    // Fallback cargo types from SMUGGLER'S UNIVERSE
    this.loadFallbackCargoTypes();
  }

  loadFallbackCargoTypes() {
    const cargoTypes = [
      // Legal Cargo
      {
        id: 'bulk_ore',
        name: 'Bulk Ore',
        category: 'raw_materials',
        legality: 'legal',
        baseValue: 500,
        volume: 100,
        description: 'Raw minerals mined from asteroids',
        rarity: 'common'
      },
      {
        id: 'manufactured_goods',
        name: 'Manufactured Goods',
        category: 'consumer_goods',
        legality: 'legal',
        baseValue: 2000,
        volume: 50,
        description: 'Factory-produced consumer items',
        rarity: 'common'
      },
      {
        id: 'medical_supplies',
        name: 'Medical Supplies',
        category: 'medical',
        legality: 'legal',
        baseValue: 1500,
        volume: 25,
        description: 'Pharmaceuticals and medical equipment',
        rarity: 'uncommon'
      },

      // Contraband
      {
        id: 'luxury_spices',
        name: 'Luxury Spices',
        category: 'luxury',
        legality: 'restricted',
        baseValue: 5000,
        volume: 10,
        description: 'Rare spices banned in some systems',
        rarity: 'rare',
        smugglingPenalty: 'high'
      },
      {
        id: 'military_tech',
        name: 'Military Technology',
        category: 'technology',
        legality: 'illegal',
        baseValue: 25000,
        volume: 5,
        description: 'Advanced weapons and military hardware',
        rarity: 'rare',
        smugglingPenalty: 'extreme'
      },
      {
        id: 'void_artifacts',
        name: 'Void Artifacts',
        category: 'artifacts',
        legality: 'restricted',
        baseValue: 50000,
        volume: 2,
        description: 'Ancient alien technology from the void',
        rarity: 'legendary',
        smugglingPenalty: 'extreme'
      },
      {
        id: 'cybernetic_enhancements',
        name: 'Cybernetic Enhancements',
        category: 'cybernetics',
        legality: 'restricted',
        baseValue: 8000,
        volume: 8,
        description: 'Illegal neural implants and augmentations',
        rarity: 'uncommon',
        smugglingPenalty: 'medium'
      },
      {
        id: 'stolen_data',
        name: 'Stolen Corporate Data',
        category: 'data',
        legality: 'illegal',
        baseValue: 15000,
        volume: 1,
        description: 'Hacked corporate secrets and trade data',
        rarity: 'rare',
        smugglingPenalty: 'high'
      }
    ];

    cargoTypes.forEach(cargo => {
      if (!this.cargoTypes.has(cargo.id)) {
        this.cargoTypes.set(cargo.id, cargo);
      }
    });
  }

  generateCargoManifest(shipCapacity, riskTolerance = 'medium') {
    const manifest = {
      id: uuidv4(),
      cargo: [],
      totalValue: 0,
      totalVolume: 0,
      riskLevel: 'low',
      createdAt: Date.now()
    };

    let remainingCapacity = shipCapacity;

    // Select cargo based on risk tolerance
    const availableCargo = Array.from(this.cargoTypes.values()).filter(cargo => {
      switch (riskTolerance) {
        case 'low': return cargo.legality === 'legal';
        case 'medium': return cargo.legality !== 'illegal';
        case 'high': return true; // All cargo including illegal
        default: return cargo.legality === 'legal';
      }
    });

    while (remainingCapacity > 0 && availableCargo.length > 0) {
      const cargo = availableCargo[Math.floor(Math.random() * availableCargo.length)];
      const maxQuantity = Math.min(
        Math.floor(remainingCapacity / cargo.volume),
        cargo.rarity === 'legendary' ? 1 : 10
      );

      if (maxQuantity > 0) {
        const quantity = Math.min(maxQuantity, Math.floor(Math.random() * 5) + 1);
        const value = cargo.baseValue * quantity;

        manifest.cargo.push({
          type: cargo.id,
          name: cargo.name,
          quantity,
          unitValue: cargo.baseValue,
          totalValue: value,
          volume: cargo.volume * quantity,
          legality: cargo.legality,
          category: cargo.category
        });

        manifest.totalValue += value;
        manifest.totalVolume += cargo.volume * quantity;
        remainingCapacity -= cargo.volume * quantity;

        // Update risk level
        if (cargo.legality === 'illegal') {
          manifest.riskLevel = 'extreme';
        } else if (cargo.legality === 'restricted' && manifest.riskLevel === 'low') {
          manifest.riskLevel = 'medium';
        }
      }

      // Remove this cargo type to avoid duplicates
      const index = availableCargo.indexOf(cargo);
      if (index > -1) availableCargo.splice(index, 1);
    }

    this.cargoManifests.set(manifest.id, manifest);
    this.updateCargoStats(manifest);

    return manifest;
  }

  updateCargoStats(manifest) {
    this.cargoStats.totalCargo += manifest.cargo.length;
    this.cargoStats.totalValue += manifest.totalValue;

    const contraband = manifest.cargo.filter(item =>
      this.cargoTypes.get(item.type)?.legality === 'illegal'
    );
    this.cargoStats.contrabandValue += contraband.reduce((sum, item) => sum + item.totalValue, 0);
  }

  getCargoStats() {
    return {
      ...this.cargoStats,
      uniqueCargoTypes: this.cargoTypes.size,
      manifestsGenerated: this.cargoManifests.size,
      contrabandPercentage: this.cargoStats.totalValue > 0 ?
        (this.cargoStats.contrabandValue / this.cargoStats.totalValue) * 100 : 0
    };
  }
}

class JobBoardManager {
  constructor() {
    this.jobs = new Map();
    this.completedJobs = [];
    this.jobStats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalPayout: 0
    };
  }

  async initialize() {
    await this.loadJobTemplates();
    this.startJobGeneration();
    logger.info('Job Board Manager initialized');
  }

  async loadJobTemplates() {
    if (commercialPlatform.loreIntegration) {
      try {
        const response = await axios.get(`${commercialPlatform.loreIntegration.baseUrl}/api/lore/jobs`);
        const jobData = response.data.data;
        this.jobTemplates = jobData;
      } catch (error) {
        logger.debug('Failed to load job templates from lore:', error.message);
      }
    }

    this.jobTemplates = this.getFallbackJobTemplates();
  }

  getFallbackJobTemplates() {
    return [
      // Courier Jobs
      {
        type: 'courier',
        name: 'Package Delivery',
        description: 'Deliver a package to {destination}',
        risk: 'low',
        payout: { min: 500, max: 2000 },
        duration: { min: 2, max: 8 }, // hours
        requirements: ['reliable_ship'],
        objectives: ['reach_destination', 'deliver_package']
      },
      {
        type: 'courier',
        name: 'Express Courier',
        description: 'Rush delivery to {destination} within 4 hours',
        risk: 'medium',
        payout: { min: 1500, max: 4000 },
        duration: { min: 1, max: 4 },
        requirements: ['fast_ship', 'experienced_pilot'],
        objectives: ['reach_destination_quickly', 'deliver_package']
      },

      // Smuggling Jobs
      {
        type: 'smuggling',
        name: 'Contraband Run',
        description: 'Smuggle {cargo} from {origin} to {destination}',
        risk: 'high',
        payout: { min: 5000, max: 15000 },
        duration: { min: 6, max: 24 },
        requirements: ['discreet_ship', 'smuggling_experience'],
        objectives: ['avoid_authority', 'deliver_cargo_safely']
      },
      {
        type: 'smuggling',
        name: 'High-Value Contraband',
        description: 'Transport illegal {cargo} through Authority space',
        risk: 'extreme',
        payout: { min: 25000, max: 75000 },
        duration: { min: 12, max: 48 },
        requirements: ['stealth_ship', 'elite_smuggler'],
        objectives: ['evade_patrols', 'deliver_without_detection']
      },

      // Bounty Jobs
      {
        type: 'bounty',
        name: 'Wanted Criminal',
        description: 'Capture or eliminate wanted criminal {target}',
        risk: 'high',
        payout: { min: 3000, max: 10000 },
        duration: { min: 4, max: 16 },
        requirements: ['combat_ready', 'tracking_skills'],
        objectives: ['locate_target', 'capture_or_eliminate']
      },

      // Salvage Jobs
      {
        type: 'salvage',
        name: 'Derelict Ship Recovery',
        description: 'Salvage valuable cargo from derelict ship at {location}',
        risk: 'medium',
        payout: { min: 2000, max: 8000 },
        duration: { min: 3, max: 12 },
        requirements: ['salvage_equipment'],
        objectives: ['reach_location', 'salvage_cargo']
      }
    ];
  }

  startJobGeneration() {
    // Generate new jobs periodically
    setInterval(() => {
      this.generateRandomJobs();
    }, 600000); // Every 10 minutes

    // Clean up expired jobs
    setInterval(() => {
      this.cleanupExpiredJobs();
    }, 3600000); // Every hour
  }

  generateRandomJobs(count = 3) {
    for (let i = 0; i < count; i++) {
      const template = this.jobTemplates[Math.floor(Math.random() * this.jobTemplates.length)];
      const job = this.createJobFromTemplate(template);
      this.jobs.set(job.id, job);
    }
  }

  createJobFromTemplate(template) {
    const job = {
      id: uuidv4(),
      type: template.type,
      name: template.name,
      description: this.fillJobDescription(template.description),
      risk: template.risk,
      payout: this.calculatePayout(template.payout),
      duration: this.calculateDuration(template.duration),
      requirements: template.requirements,
      objectives: template.objectives,
      status: 'available',
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      issuer: this.generateJobIssuer(template.type)
    };

    return job;
  }

  fillJobDescription(description) {
    const locations = ['Neo-Vegas Orbit', 'Free Port Station', 'Scavenger Belt Outpost', 'Corporate Core Hub'];
    const cargo = ['luxury goods', 'military tech', 'medical supplies', 'stolen data'];

    return description
      .replace('{destination}', locations[Math.floor(Math.random() * locations.length)])
      .replace('{origin}', locations[Math.floor(Math.random() * locations.length)])
      .replace('{location}', locations[Math.floor(Math.random() * locations.length)])
      .replace('{cargo}', cargo[Math.floor(Math.random() * cargo.length)])
      .replace('{target}', `Criminal #${Math.floor(Math.random() * 1000)}`);
  }

  calculatePayout(payoutRange) {
    const base = Math.random() * (payoutRange.max - payoutRange.min) + payoutRange.min;
    return Math.floor(base);
  }

  calculateDuration(durationRange) {
    const hours = Math.random() * (durationRange.max - durationRange.min) + durationRange.min;
    return Math.floor(hours);
  }

  generateJobIssuer(jobType) {
    const issuers = {
      courier: ['Local Merchant', 'Corporate Logistics', 'Guild Dispatcher'],
      smuggling: ['Syndicate Contact', 'Black Market Broker', 'Smuggler\'s Guild'],
      bounty: ['Authority Marshal', 'Corporate Security', 'Private Contractor'],
      salvage: ['Scavenger Clan', 'Salvage Company', 'Independent Contractor']
    };

    const typeIssuers = issuers[jobType] || ['Unknown'];
    return typeIssuers[Math.floor(Math.random() * typeIssuers.length)];
  }

  cleanupExpiredJobs() {
    const now = Date.now();
    for (const [jobId, job] of this.jobs) {
      if (job.expiresAt < now && job.status === 'available') {
        this.jobs.delete(jobId);
      }
    }
  }

  acceptJob(jobId, playerId) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'available') {
      throw new Error('Job not available');
    }

    job.status = 'active';
    job.acceptedBy = playerId;
    job.acceptedAt = Date.now();
    job.deadline = job.acceptedAt + (job.duration * 60 * 60 * 1000);

    return job;
  }

  completeJob(jobId, success = true) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'active') {
      throw new Error('Job not active');
    }

    job.status = success ? 'completed' : 'failed';
    job.completedAt = Date.now();

    this.completedJobs.push(job);
    this.jobStats.totalJobs++;
    if (success) {
      this.jobStats.completedJobs++;
      this.jobStats.totalPayout += job.payout;
    } else {
      this.jobStats.failedJobs++;
    }

    // Keep only recent completed jobs
    if (this.completedJobs.length > 100) {
      this.completedJobs = this.completedJobs.slice(-50);
    }

    return job;
  }

  getJobStats() {
    return {
      ...this.jobStats,
      successRate: this.jobStats.totalJobs > 0 ?
        (this.jobStats.completedJobs / this.jobStats.totalJobs) * 100 : 0,
      activeJobs: Array.from(this.jobs.values()).filter(job => job.status === 'active').length,
      availableJobs: Array.from(this.jobs.values()).filter(job => job.status === 'available').length
    };
  }
}

class BlackMarketManager {
  constructor() {
    this.listings = new Map();
    this.transactions = [];
    this.marketStats = {
      totalListings: 0,
      totalTransactions: 0,
      totalVolume: 0
    };
  }

  async initialize() {
    this.startMarketFluctuations();
    logger.info('Black Market Manager initialized');
  }

  createBlackMarketListing(itemData, sellerId) {
    const listing = {
      id: uuidv4(),
      item: itemData,
      sellerId,
      askingPrice: this.calculateBlackMarketPrice(itemData),
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (4 * 60 * 60 * 1000), // 4 hours
      risk: this.calculateListingRisk(itemData)
    };

    this.listings.set(listing.id, listing);
    this.marketStats.totalListings++;

    return listing;
  }

  calculateBlackMarketPrice(itemData) {
    const basePrice = itemData.baseValue || 1000;
    const rarityMultiplier = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      legendary: 5.0
    };

    const legalityMultiplier = {
      legal: 1.0,
      restricted: 1.8,
      illegal: 3.0
    };

    const marketVolatility = 0.8 + Math.random() * 0.4; // 0.8-1.2

    return Math.floor(
      basePrice *
      (rarityMultiplier[itemData.rarity] || 1.0) *
      (legalityMultiplier[itemData.legality] || 1.0) *
      marketVolatility
    );
  }

  calculateListingRisk(itemData) {
    const baseRisk = {
      legal: 'low',
      restricted: 'medium',
      illegal: 'high'
    };

    return baseRisk[itemData.legality] || 'medium';
  }

  purchaseBlackMarketItem(listingId, buyerId) {
    const listing = this.listings.get(listingId);
    if (!listing || listing.status !== 'active') {
      throw new Error('Listing not available');
    }

    // Simulate black market transaction risks
    const interceptionRisk = listing.risk === 'high' ? 0.2 : listing.risk === 'medium' ? 0.1 : 0.05;
    const intercepted = Math.random() < interceptionRisk;

    const transaction = {
      id: uuidv4(),
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      item: listing.item,
      price: listing.askingPrice,
      status: intercepted ? 'intercepted' : 'completed',
      timestamp: Date.now(),
      risk: listing.risk
    };

    this.transactions.push(transaction);
    this.marketStats.totalTransactions++;
    this.marketStats.totalVolume += transaction.price;

    if (!intercepted) {
      listing.status = 'sold';
    }

    return transaction;
  }

  startMarketFluctuations() {
    // Update prices periodically
    setInterval(() => {
      this.updateMarketPrices();
    }, 1800000); // Every 30 minutes
  }

  updateMarketPrices() {
    for (const [listingId, listing] of this.listings) {
      if (listing.status === 'active') {
        const volatility = 0.9 + Math.random() * 0.2; // ±10%
        listing.askingPrice = Math.floor(listing.askingPrice * volatility);
      }
    }
  }

  getBlackMarketStats() {
    const activeListings = Array.from(this.listings.values()).filter(l => l.status === 'active');
    const recentTransactions = this.transactions.slice(-20);

    return {
      ...this.marketStats,
      activeListings: activeListings.length,
      averagePrice: activeListings.length > 0 ?
        activeListings.reduce((sum, l) => sum + l.askingPrice, 0) / activeListings.length : 0,
      recentTransactions,
      interceptionRate: recentTransactions.length > 0 ?
        (recentTransactions.filter(t => t.status === 'intercepted').length / recentTransactions.length) * 100 : 0
    };
  }
}

class TradeRouteManager {
  constructor() {
    this.routes = new Map();
    this.routeStats = {
      activeRoutes: 0,
      totalTraffic: 0,
      interdictions: 0
    };
  }

  async initialize() {
    await this.generateTradeRoutes();
    this.startRouteSimulation();
    logger.info('Trade Route Manager initialized');
  }

  async generateTradeRoutes() {
    const locations = [
      'Neo-Vegas Orbit', 'Free Port Station', 'Corporate Core Hub',
      'Scavenger Belt Outpost', 'Authority Patrol Base', 'Syndicate Hideout'
    ];

    // Generate major trade routes
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const route = {
          id: `${locations[i]}-${locations[j]}`,
          start: locations[i],
          end: locations[j],
          distance: Math.floor(Math.random() * 50) + 10, // 10-60 light years
          traffic: Math.floor(Math.random() * 100) + 10, // 10-110 ships per day
          risk: this.calculateRouteRisk(locations[i], locations[j]),
          tolls: this.calculateRouteTolls(locations[i], locations[j]),
          createdAt: Date.now()
        };

        this.routes.set(route.id, route);
      }
    }

    this.routeStats.activeRoutes = this.routes.size;
  }

  calculateRouteRisk(start, end) {
    // Authority presence increases risk
    const authorityRisk = (start.includes('Authority') || end.includes('Authority')) ? 0.3 : 0;
    // Syndicate routes are riskier
    const syndicateRisk = (start.includes('Syndicate') || end.includes('Syndicate')) ? 0.2 : 0;
    // Long distance increases risk
    const distanceRisk = Math.random() * 0.2;

    return Math.min(1, authorityRisk + syndicateRisk + distanceRisk);
  }

  calculateRouteTolls(start, end) {
    let tolls = 0;

    // Authority routes have tolls
    if (start.includes('Authority') || end.includes('Authority')) {
      tolls += 500;
    }

    // Corporate routes have fees
    if (start.includes('Corporate') || end.includes('Corporate')) {
      tolls += 200;
    }

    return tolls;
  }

  startRouteSimulation() {
    // Simulate trade traffic
    setInterval(() => {
      this.simulateTradeTraffic();
    }, 300000); // Every 5 minutes
  }

  simulateTradeTraffic() {
    for (const [routeId, route] of this.routes) {
      // Random traffic fluctuation
      const trafficChange = Math.floor((Math.random() - 0.5) * 20);
      route.traffic = Math.max(0, route.traffic + trafficChange);

      // Random interdictions
      if (Math.random() < route.risk * 0.1) {
        route.interdictions = (route.interdictions || 0) + 1;
        this.routeStats.interdictions++;
      }

      this.routeStats.totalTraffic += route.traffic;
    }
  }

  getRouteStats() {
    const routes = Array.from(this.routes.values());
    const highRiskRoutes = routes.filter(r => r.risk > 0.5);
    const totalTolls = routes.reduce((sum, r) => sum + r.tolls, 0);

    return {
      ...this.routeStats,
      totalRoutes: routes.length,
      highRiskRoutes: highRiskRoutes.length,
      averageRisk: routes.length > 0 ?
        routes.reduce((sum, r) => sum + r.risk, 0) / routes.length : 0,
      totalTolls,
      averageTraffic: routes.length > 0 ?
        routes.reduce((sum, r) => sum + r.traffic, 0) / routes.length : 0
    };
  }
}

// Initialize Commercial Platform with SMUGGLER'S UNIVERSE smuggling
const commercialPlatform = new CommercialPlatform();

// API Routes for SMUGGLER'S UNIVERSE Smuggling
app.get('/api/smuggling/stats', async (req, res) => {
  try {
    const stats = commercialPlatform.smuggling.getSmugglingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting smuggling stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cargo/manifest', async (req, res) => {
  try {
    const { shipCapacity, riskTolerance } = req.body;
    const manifest = commercialPlatform.cargoSystem.generateCargoManifest(shipCapacity, riskTolerance);
    res.json({ success: true, data: manifest });
  } catch (error) {
    logger.error('Error generating cargo manifest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/cargo/stats', async (req, res) => {
  try {
    const stats = commercialPlatform.cargoSystem.getCargoStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting cargo stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/jobs/available', async (req, res) => {
  try {
    const jobs = Array.from(commercialPlatform.jobBoard.jobs.values())
      .filter(job => job.status === 'available');
    res.json({ success: true, data: jobs });
  } catch (error) {
    logger.error('Error getting available jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/jobs/:jobId/accept', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { playerId } = req.body;
    const job = commercialPlatform.jobBoard.acceptJob(jobId, playerId);
    res.json({ success: true, data: job });
  } catch (error) {
    logger.error('Error accepting job:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/jobs/:jobId/complete', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { success } = req.body;
    const job = commercialPlatform.jobBoard.completeJob(jobId, success);
    res.json({ success: true, data: job });
  } catch (error) {
    logger.error('Error completing job:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/jobs/stats', async (req, res) => {
  try {
    const stats = commercialPlatform.jobBoard.getJobStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting job stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/blackmarket/listing', async (req, res) => {
  try {
    const { itemData, sellerId } = req.body;
    const listing = commercialPlatform.blackMarket.createBlackMarketListing(itemData, sellerId);
    res.json({ success: true, data: listing });
  } catch (error) {
    logger.error('Error creating black market listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/blackmarket/listings', async (req, res) => {
  try {
    const listings = Array.from(commercialPlatform.blackMarket.listings.values())
      .filter(listing => listing.status === 'active');
    res.json({ success: true, data: listings });
  } catch (error) {
    logger.error('Error getting black market listings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/blackmarket/:listingId/purchase', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { buyerId } = req.body;
    const transaction = commercialPlatform.blackMarket.purchaseBlackMarketItem(listingId, buyerId);
    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error('Error purchasing black market item:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/blackmarket/stats', async (req, res) => {
  try {
    const stats = commercialPlatform.blackMarket.getBlackMarketStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting black market stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/traderoutes', async (req, res) => {
  try {
    const routes = Array.from(commercialPlatform.tradeRoutes.routes.values());
    res.json({ success: true, data: routes });
  } catch (error) {
    logger.error('Error getting trade routes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/traderoutes/stats', async (req, res) => {
  try {
    const stats = commercialPlatform.tradeRoutes.getRouteStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting trade route stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();
    await commercialPlatform.initialize();

    app.listen(PORT, () => {
      logger.info(`Commercial Platform running on port ${PORT}`);
      console.log(`💰 Commercial Platform v3.0 - SMUGGLER'S UNIVERSE Commercial Launch`);
      console.log(`🌐 Listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🛒 Marketplace: http://localhost:${PORT}/api/marketplace/listings`);
      console.log(`💳 Payments: http://localhost:${PORT}/api/payments/process`);
      console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/dashboard`);
      console.log(`🎯 Acquisition: http://localhost:${PORT}/api/acquisition/campaigns`);
      console.log(`🚀 Smuggling: http://localhost:${PORT}/api/smuggling/stats`);
      console.log(`📦 Cargo: http://localhost:${PORT}/api/cargo/manifest`);
      console.log(`💼 Jobs: http://localhost:${PORT}/api/jobs/available`);
      console.log(`🕵️ Black Market: http://localhost:${PORT}/api/blackmarket/listings`);
      console.log(`🛣️ Trade Routes: http://localhost:${PORT}/api/traderoutes`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
