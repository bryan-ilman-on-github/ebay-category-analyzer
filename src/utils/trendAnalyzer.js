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
   * No trend analysis - just return empty object
   */
  analyzeTrend(item, allItems = []) {
    return { symbol: '', label: '' };
  }

  /**
   * No trend scoring - removed
   */
  calculateTrendScore(item, allItems) {
    return 0;
  }

  /**
   * Extract key metrics from eBay item data (Browse API format)
   */
  extractMetrics(item) {
    const hasDiscount = item.marketingPrice?.discountPercentage;
    const freeShipping = item.shippingOptions?.[0]?.shippingCost?.value === '0.00';

    return {
      price: parseFloat(item.price?.value || 0),
      currency: item.price?.currency || 'USD',
      originalPrice: hasDiscount ? parseFloat(item.marketingPrice.originalPrice.value) : null,
      discountPercent: hasDiscount ? item.marketingPrice.discountPercentage : null,
      condition: item.condition || 'Unknown',
      sellerFeedback: parseInt(item.seller?.feedbackScore || 0),
      sellerRating: parseFloat(item.seller?.feedbackPercentage || 0),
      sellerUsername: item.seller?.username || 'Unknown',
      topRated: item.topRatedBuyingExperience || false,
      promoted: item.priorityListing || false,
      freeShipping,
      itemUrl: item.itemWebUrl || '#',
      itemId: item.legacyItemId || item.itemId || 'N/A',
      categories: item.categories?.map(c => c.categoryName) || [],
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
