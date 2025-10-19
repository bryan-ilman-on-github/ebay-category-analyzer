#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import EbayClient from './api/ebayClient.js';
import { TrendAnalyzer } from './utils/trendAnalyzer.js';
import { ProductFormatter } from './utils/formatter.js';
import { CacheManager } from './utils/cache.js';
import { getCategoryChoices, getCategoryById } from './constants/categories.js';

/**
 * TrendSpotter - eBay Category Analyzer
 * Main CLI application
 */

class TrendSpotter {
  constructor() {
    this.ebayClient = new EbayClient();
    this.analyzer = new TrendAnalyzer();
    this.formatter = new ProductFormatter();
    this.cache = new CacheManager();
  }

  /**
   * Main application flow
   */
  async run() {
    try {
      this.printHeader();

      // Select category
      const { categoryId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'categoryId',
          message: 'Select an eBay category to analyze:',
          choices: getCategoryChoices(),
          pageSize: 12,
        },
      ]);

      const category = getCategoryById(categoryId);
      console.log(chalk.gray(`\nAnalyzing ${category.name}...\n`));

      // Fetch data (with caching)
      const data = await this.fetchCategoryData(categoryId);

      // Analyze trends
      const results = this.analyzeProducts(data.items);

      // Display results
      this.displayResults(category, results, data);

      // Ask to continue
      await this.askToContinue();

    } catch (error) {
      console.error(this.formatter.formatError(error));
      process.exit(1);
    }
  }

  /**
   * Fetch category data from eBay API (with caching)
   */
  async fetchCategoryData(categoryId) {
    const cacheKey = `category_${categoryId}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = this.cache.getCacheAge(cacheKey);
      console.log(chalk.yellow(`Using cached data (${age.toFixed(1)} hours old)\n`));
      return cached;
    }

    // Fetch fresh data
    console.log(chalk.gray('Fetching live data from eBay API...\n'));

    const activeData = await this.ebayClient.findItemsByCategory(categoryId, 20);

    if (!activeData.success) {
      throw new Error('Failed to fetch category data from eBay');
    }

    // Enrich with detailed data (watchCount, quantitySold)
    const enrichedItems = await this.ebayClient.enrichItemsWithDetails(activeData.items);

    const result = {
      ...activeData,
      items: enrichedItems,
      soldItems: [],
    };

    // Cache the result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Extract metrics from products (no sorting, API already sorted by price)
   */
  analyzeProducts(items) {
    const products = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const metrics = this.analyzer.extractMetrics(item);
        const trend = { symbol: '', label: '' }; // No trend analysis

        products.push({
          item,
          metrics,
          trend,
        });
      } catch (error) {
        console.error(`Error processing item ${i + 1}:`, error.message);
        console.error('Item data:', JSON.stringify(item, null, 2));
        throw error;
      }
    }

    // No sorting - keep API order
    return products;
  }

  /**
   * Display formatted results
   */
  displayResults(category, products, data) {
    // Category summary
    const stats = this.analyzer.calculateCategoryStats(data.items);
    console.log(this.formatter.formatCategorySummary(category.name, stats, data.metadata));

    // Market comparison
    if (data.soldItems && data.soldItems.length > 0) {
      const comparison = this.analyzer.compareWithSoldItems(data.items, data.soldItems);
      console.log(this.formatter.formatMarketComparison(comparison));
    }

    // Top 20 trending products (eBay's Best Match algorithm)
    console.log(chalk.bold('TOP 20 TRENDING PRODUCTS (eBay Best Match):\n'));

    products.slice(0, 20).forEach((product, index) => {
      console.log(
        this.formatter.formatProduct(
          product.item,
          index + 1,
          product.trend,
          product.metrics
        )
      );
    });

    console.log(this.formatter.formatFooter());
  }

  /**
   * Print application header
   */
  printHeader() {
    console.clear();
    console.log(chalk.bold.cyan(`
📊 TrendSpotter - eBay Category Analyzer

Discover trending products in eBay categories
Sorted by eBay's "Best Match" algorithm - shows popular & relevant items
    `));
  }

  /**
   * Ask user if they want to analyze another category
   */
  async askToContinue() {
    const { continueAnalysis } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnalysis',
        message: 'Analyze another category?',
        default: true,
      },
    ]);

    if (continueAnalysis) {
      await this.run();
    } else {
      console.log(chalk.cyan('\n✨ Thanks for using TrendSpotter!\n'));
      process.exit(0);
    }
  }
}

// Run the application
const app = new TrendSpotter();
app.run().catch(error => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});
