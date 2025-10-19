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
   * Updated for Browse API format
   */
  calculateTrendScore(item, allItems) {
    let score = 0;
    const weights = {
      watcherCount: 0.3,
      bidCount: 0.2,
      sellerQuality: 0.2,
      priceCompetitiveness: 0.3,
    };

    // 1. Watchers score (normalized) - Browse API format
    const watcherCount = parseInt(item.watchCount || 0);
    const maxWatchers = Math.max(...allItems.map(i => parseInt(i.watchCount || 0)), 1);
    score += (watcherCount / maxWatchers) * weights.watcherCount;

    // 2. Bid count (engagement indicator)
    const bidCount = parseInt(item.bidCount || 0);
    const maxBids = Math.max(...allItems.map(i => parseInt(i.bidCount || 0)), 1);
    score += (bidCount / maxBids) * weights.bidCount;

    // 3. Seller quality (feedback percentage)
    const sellerFeedback = parseFloat(item.seller?.feedbackPercentage || 0);
    const sellerScore = sellerFeedback > 95 ? 1 : sellerFeedback / 100;
    score += sellerScore * weights.sellerQuality;

    // 4. Price competitiveness (lower than average = more competitive)
    const price = parseFloat(item.price?.value || 0);
    const avgPrice = allItems.reduce((sum, i) => sum + parseFloat(i.price?.value || 0), 0) / allItems.length;
    const priceScore = avgPrice > 0 ? Math.min(1, avgPrice / price - 0.5) : 0.5;
    score += Math.max(0, priceScore) * weights.priceCompetitiveness;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Extract key metrics from eBay item data (Browse API format)
   */
  extractMetrics(item) {
    return {
      price: parseFloat(item.price?.value || 0),
      currency: item.price?.currency || 'USD',
      watchers: parseInt(item.watchCount || 0),
      bidCount: parseInt(item.bidCount || 0),
      listingType: item.buyingOptions?.[0] || 'Unknown',
      condition: item.condition || 'Unknown',
      sellerFeedback: parseInt(item.seller?.feedbackScore || 0),
      sellerRating: parseFloat(item.seller?.feedbackPercentage || 0),
      topRatedSeller: item.seller?.sellerAccountType === 'BUSINESS',
      itemUrl: item.itemWebUrl || item.itemAffiliateWebUrl || '#',
      itemId: item.itemId || 'N/A',
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
      parseFloat(item.price?.value || 0)
    ).filter(p => p > 0);

    const watchers = items.map(item =>
      parseInt(item.watchCount || 0)
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
