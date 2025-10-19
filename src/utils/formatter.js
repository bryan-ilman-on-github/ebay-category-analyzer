import chalk from 'chalk';

/**
 * Formats product data for CLI display with source attribution
 * All data comes from official eBay API - includes links for verification
 */

export class ProductFormatter {
  constructor() {
    this.maxTitleLength = 60;
  }

  /**
   * Format a single product with all credibility markers
   */
  formatProduct(item, index, trend, metrics) {
    const title = this.truncateTitle(item.title?.[0] || 'Unknown Product');
    const itemUrl = item.viewItemURL?.[0] || '#';
    const itemId = item.itemId?.[0] || 'N/A';

    // Format price with currency
    const price = `${metrics.currency} ${metrics.price.toFixed(2)}`;

    // Format seller info for trust
    const sellerBadge = metrics.topRatedSeller ? chalk.yellow('⭐ Top Rated') : '';

    return `
${chalk.bold(`${index}. ${trend.symbol} ${title}`)}
   ${chalk.gray('├─')} Price: ${chalk.green(price)}
   ${chalk.gray('├─')} Watchers: ${chalk.cyan(metrics.watchers)} | Trend: ${chalk.bold(trend.label)}
   ${chalk.gray('├─')} Seller: ${metrics.sellerFeedback} feedback (${metrics.sellerRating}%) ${sellerBadge}
   ${chalk.gray('├─')} Listed: ${this.formatDate(metrics.startTime)}
   ${chalk.gray('└─')} Link: ${chalk.blue(itemUrl)}
   ${chalk.gray('    eBay ID:')} ${chalk.dim(itemId)}`;
  }

  /**
   * Format category summary with API metadata for credibility
   */
  formatCategorySummary(categoryName, stats, metadata) {
    return `
${chalk.bold.cyan('═'.repeat(70))}
${chalk.bold.cyan(`  CATEGORY: ${categoryName.toUpperCase()}`)}
${chalk.bold.cyan('═'.repeat(70))}

${chalk.bold('Market Overview:')}
  ${chalk.gray('•')} Total Active Listings: ${chalk.yellow(stats.totalListings.toLocaleString())}
  ${chalk.gray('•')} Average Price: ${chalk.green(`$${stats.avgPrice.toFixed(2)}`)}
  ${chalk.gray('•')} Price Range: ${chalk.gray(`$${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`)}
  ${chalk.gray('•')} Total Watchers: ${chalk.cyan(stats.totalWatchers.toLocaleString())}
  ${chalk.gray('•')} Avg Watchers/Item: ${chalk.cyan(stats.avgWatchers.toFixed(1))}

${chalk.bold('Data Source:')}
  ${chalk.gray('•')} API: ${chalk.blue('eBay Finding API (Official)')}
  ${chalk.gray('•')} Status: ${chalk.green(metadata.ack)}
  ${chalk.gray('•')} API Version: ${chalk.gray(metadata.version)}
  ${chalk.gray('•')} Fetched: ${chalk.gray(this.formatTimestamp(metadata.timestamp))}
  ${chalk.gray('•')} Showing top 20 of ${metadata.totalPages} pages available

${chalk.bold.cyan('─'.repeat(70))}
`;
  }

  /**
   * Format sold items comparison (market health indicator)
   */
  formatMarketComparison(comparison) {
    if (!comparison.available) {
      return `\n${chalk.yellow('ℹ Market comparison data not available for this category')}\n`;
    }

    const trendColor = comparison.priceChange > 0 ? chalk.red : chalk.green;
    const trendSymbol = comparison.priceChange > 0 ? '📈' : '📉';

    return `
${chalk.bold('Market Health (vs Recently Sold Items):')}
  ${chalk.gray('•')} Avg Active Price: ${chalk.green(`$${comparison.avgActivePrice.toFixed(2)}`)}
  ${chalk.gray('•')} Avg Sold Price: ${chalk.gray(`$${comparison.avgSoldPrice.toFixed(2)}`)}
  ${chalk.gray('•')} Price Change: ${trendColor(`${comparison.priceChange > 0 ? '+' : ''}${comparison.priceChange.toFixed(1)}%`)} ${trendSymbol}
  ${chalk.gray('•')} Market Trend: ${chalk.bold(comparison.trend)}

${chalk.bold.cyan('─'.repeat(70))}
`;
  }

  /**
   * Format footer with attribution
   */
  formatFooter() {
    return `
${chalk.bold.cyan('─'.repeat(70))}
${chalk.dim('Data Source: eBay Finding API')}
${chalk.dim('All prices and statistics are real-time from eBay.com')}
${chalk.dim('Click product links to verify data authenticity')}
${chalk.bold.cyan('═'.repeat(70))}
`;
  }

  /**
   * Format error message
   */
  formatError(error) {
    return `
${chalk.bold.red('ERROR:')} ${error.message}

${chalk.yellow('Troubleshooting:')}
  ${chalk.gray('•')} Verify your EBAY_APP_ID in .env file
  ${chalk.gray('•')} Check internet connection
  ${chalk.gray('•')} Verify eBay API status: https://developer.ebay.com
`;
  }

  /**
   * Truncate long titles
   */
  truncateTitle(title) {
    if (title.length <= this.maxTitleLength) return title;
    return title.substring(0, this.maxTitleLength - 3) + '...';
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  /**
   * Format API timestamp
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

export default ProductFormatter;
