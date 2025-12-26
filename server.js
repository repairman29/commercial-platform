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

// Commercial Platform Core Systems
class CommercialPlatform {
  constructor() {
    this.marketplace = new MarketplaceManager();
    this.payments = new PaymentProcessor();
    this.subscriptions = new SubscriptionManager();
    this.analytics = new CommercialAnalytics();
    this.userAcquisition = new UserAcquisitionManager();
    this.revenue = new RevenueManager();
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

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      logger.info(`Commercial Platform running on port ${PORT}`);
      console.log(`💰 Commercial Platform v2.0 - Full Commercial Launch`);
      console.log(`🌐 Listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🛒 Marketplace: http://localhost:${PORT}/api/marketplace/listings`);
      console.log(`💳 Payments: http://localhost:${PORT}/api/payments/process`);
      console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/dashboard`);
      console.log(`🎯 Acquisition: http://localhost:${PORT}/api/acquisition/campaigns`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
