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
    // Safety check for Browse API format
    if (!item || !item.price) {
      console.error('Invalid item format:', item);
      throw new Error('Invalid item data format - cache may be outdated');
    }

    const hasDiscount = item.marketingPrice?.discountPercentage;
    const freeShipping = item.shippingOptions?.[0]?.shippingCost?.value === '0.00';

    return {
      price: parseFloat(item.price.value || 0),
      currency: item.price.currency || 'USD',
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
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      totalListings: items.length,
      totalWatchers: watchers.reduce((a, b) => a + b, 0),
      avgWatchers: watchers.length > 0 ? watchers.reduce((a, b) => a + b, 0) / watchers.length : 0,
    };
  }

  /**
   * Compare with completed items to determine market health
   */
  compareWithSoldItems(activeItems, soldItems) {
    // Browse API doesn't support sold items
    return { available: false, reason: 'No sold items data available' };
  }
}

export default TrendAnalyzer;
