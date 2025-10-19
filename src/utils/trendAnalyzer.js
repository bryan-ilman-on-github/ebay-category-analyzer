/**
 * Trend Analyzer
 * Calculates trend indicators based on real eBay data:
 * - Listing velocity (how fast items are being listed)
 * - Engagement (watchers, bids)
 * - Price trends (compared to sold items)
 */

export class TrendAnalyzer {
  constructor() {
    this.trends = {
      HOT: { symbol: '🔥', label: 'Hot', threshold: 0.7 },
      RISING: { symbol: '📈', label: 'Rising', threshold: 0.4 },
      STABLE: { symbol: '➡️', label: 'Stable', threshold: 0.2 },
      DECLINING: { symbol: '📉', label: 'Declining', threshold: 0 },
    };
  }

  /**
   * Analyze a product and determine its trend
   * Uses multiple factors: watchers, listing count, seller quality
   */
  analyzeTrend(item, allItems = []) {
    const score = this.calculateTrendScore(item, allItems);

    if (score >= this.trends.HOT.threshold) return this.trends.HOT;
    if (score >= this.trends.RISING.threshold) return this.trends.RISING;
    if (score >= this.trends.STABLE.threshold) return this.trends.STABLE;
    return this.trends.DECLINING;
  }

  /**
   * Calculate trend score (0-1) based on multiple signals
   */
  calculateTrendScore(item, allItems) {
    let score = 0;
    const weights = {
      watchers: 0.4,
      sellerQuality: 0.2,
      listingVelocity: 0.2,
      priceCompetitiveness: 0.2,
    };

    // 1. Watchers score (normalized)
    const watcherCount = parseInt(item.listingInfo?.[0]?.watchCount?.[0] || 0);
    const maxWatchers = Math.max(...allItems.map(i =>
      parseInt(i.listingInfo?.[0]?.watchCount?.[0] || 0)
    ), 1);
    score += (watcherCount / maxWatchers) * weights.watchers;

    // 2. Seller quality (positive feedback ratio)
    const feedbackScore = parseInt(item.sellerInfo?.[0]?.feedbackScore?.[0] || 0);
    const positiveFeedback = parseFloat(item.sellerInfo?.[0]?.positiveFeedbackPercent?.[0] || 0);
    const sellerScore = feedbackScore > 100 && positiveFeedback > 95 ? 1 : 0.5;
    score += sellerScore * weights.sellerQuality;

    // 3. Listing velocity (newer listings = trending)
    const listingDate = new Date(item.listingInfo?.[0]?.startTime?.[0]);
    const daysSinceListing = (Date.now() - listingDate) / (1000 * 60 * 60 * 24);
    const velocityScore = Math.max(0, 1 - (daysSinceListing / 30)); // Newer = higher score
    score += velocityScore * weights.listingVelocity;

    // 4. Price competitiveness (lower than average = more competitive)
    const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0].__value__ || 0);
    const avgPrice = allItems.reduce((sum, i) =>
      sum + parseFloat(i.sellingStatus?.[0]?.currentPrice?.[0].__value__ || 0), 0
    ) / allItems.length;
    const priceScore = avgPrice > 0 ? Math.min(1, avgPrice / price - 0.5) : 0.5;
    score += Math.max(0, priceScore) * weights.priceCompetitiveness;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Extract key metrics from eBay item data
   */
  extractMetrics(item) {
    const sellingStatus = item.sellingStatus?.[0] || {};
    const listingInfo = item.listingInfo?.[0] || {};
    const sellerInfo = item.sellerInfo?.[0] || {};

    return {
      price: parseFloat(sellingStatus.currentPrice?.[0].__value__ || 0),
      currency: sellingStatus.currentPrice?.[0]['@currencyId'] || 'USD',
      watchers: parseInt(listingInfo.watchCount?.[0] || 0),
      listingType: listingInfo.listingType?.[0] || 'Unknown',
      startTime: listingInfo.startTime?.[0],
      endTime: listingInfo.endTime?.[0],
      sellerFeedback: parseInt(sellerInfo.feedbackScore?.[0] || 0),
      sellerRating: parseFloat(sellerInfo.positiveFeedbackPercent?.[0] || 0),
      topRatedSeller: sellerInfo.topRatedSeller?.[0] === 'true',
    };
  }

  /**
   * Calculate category-wide statistics
   */
  calculateCategoryStats(items) {
    if (!items || items.length === 0) {
      return {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        totalListings: 0,
        totalWatchers: 0,
        avgWatchers: 0,
      };
    }

    const prices = items.map(item =>
      parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0].__value__ || 0)
    ).filter(p => p > 0);

    const watchers = items.map(item =>
      parseInt(item.listingInfo?.[0]?.watchCount?.[0] || 0)
    );

    return {
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalListings: items.length,
      totalWatchers: watchers.reduce((a, b) => a + b, 0),
      avgWatchers: watchers.reduce((a, b) => a + b, 0) / watchers.length,
    };
  }

  /**
   * Compare with completed items to determine market health
   */
  compareWithSoldItems(activeItems, soldItems) {
    if (!soldItems || soldItems.length === 0) {
      return { available: false, reason: 'No sold items data available' };
    }

    const activePrices = activeItems.map(item =>
      parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0].__value__ || 0)
    );

    const soldPrices = soldItems.map(item =>
      parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0].__value__ || 0)
    );

    const avgActivePrice = activePrices.reduce((a, b) => a + b, 0) / activePrices.length;
    const avgSoldPrice = soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length;

    const priceChange = ((avgActivePrice - avgSoldPrice) / avgSoldPrice) * 100;

    return {
      available: true,
      avgActivePrice,
      avgSoldPrice,
      priceChange,
      trend: priceChange > 5 ? 'Increasing' : priceChange < -5 ? 'Decreasing' : 'Stable',
    };
  }
}

export default TrendAnalyzer;
