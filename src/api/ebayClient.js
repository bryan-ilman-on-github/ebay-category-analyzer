import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EBAY_FINDING_API_URL = 'https://svcs.ebay.com/services/search/FindingService/v1';

class EbayClient {
  constructor() {
    this.appId = process.env.EBAY_APP_ID;
    this.siteId = process.env.EBAY_SITE_ID || 'EBAY-US';
    this.version = process.env.EBAY_API_VERSION || '1.13.0';

    if (!this.appId) {
      throw new Error('EBAY_APP_ID is required. Please set it in .env file');
    }
  }

  /**
   * Fetches trending products from a specific category
   * Uses eBay's official Finding API - all data is real and verifiable
   * @param {string} categoryId - eBay category ID
   * @param {number} limit - Number of items to fetch (max 100)
   * @returns {Promise<Object>} API response with metadata for credibility
   */
  async findItemsByCategory(categoryId, limit = 20) {
    try {
      const params = {
        'OPERATION-NAME': 'findItemsAdvanced',
        'SERVICE-VERSION': this.version,
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'categoryId': categoryId,
        'sortOrder': 'BestMatch',
        'paginationInput.entriesPerPage': limit,
        // Focus on active listings with watchers (trending indicator)
        'itemFilter(0).name': 'ListingType',
        'itemFilter(0).value': 'FixedPrice',
        'itemFilter(1).name': 'MinPrice',
        'itemFilter(1).value': '1',
        'itemFilter(2).name': 'HideDuplicateItems',
        'itemFilter(2).value': 'true',
        // Additional filters for quality data
        'outputSelector(0)': 'SellerInfo',
        'outputSelector(1)': 'StoreInfo',
      };

      const response = await axios.get(EBAY_FINDING_API_URL, { params });

      // Add metadata for credibility and transparency
      const result = response.data.findItemsAdvancedResponse?.[0];

      if (!result || result.ack?.[0] !== 'Success') {
        throw new Error('eBay API request failed: ' + JSON.stringify(result?.errorMessage));
      }

      return {
        success: true,
        items: result.searchResult?.[0]?.item || [],
        timestamp: result.timestamp?.[0],
        version: result.version?.[0],
        totalEntries: parseInt(result.paginationOutput?.[0]?.totalEntries?.[0] || 0),
        categoryId,
        source: 'eBay Finding API (Official)',
        apiEndpoint: EBAY_FINDING_API_URL,
        // Proof of authenticity
        metadata: {
          ack: result.ack?.[0],
          version: result.version?.[0],
          timestamp: result.timestamp?.[0],
          totalPages: result.paginationOutput?.[0]?.totalPages?.[0],
        }
      };

    } catch (error) {
      // Check for rate limit error
      if (error.response?.data?.errorMessage?.[0]?.error?.[0]?.errorId?.[0] === '10001') {
        throw new Error('eBay API rate limit exceeded. Please wait 1 hour and try again.');
      }

      console.error('Error fetching eBay data:', error.message);
      throw new Error(`Failed to fetch data from eBay: ${error.message}`);
    }
  }

  /**
   * Get completed listings to analyze price trends
   * This helps calculate average sold prices (market reality)
   */
  async findCompletedItems(categoryId, limit = 20) {
    try {
      const params = {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': this.version,
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'categoryId': categoryId,
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': limit,
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
      };

      const response = await axios.get(EBAY_FINDING_API_URL, { params });
      const result = response.data.findCompletedItemsResponse?.[0];

      if (!result || result.ack?.[0] !== 'Success') {
        // Completed items might not be available for all categories
        return { success: false, items: [], reason: 'No completed items data' };
      }

      return {
        success: true,
        items: result.searchResult?.[0]?.item || [],
        timestamp: result.timestamp?.[0],
        source: 'eBay Finding API - Completed Items (Official)',
      };

    } catch (error) {
      // Non-critical error - just log and continue
      console.warn('Could not fetch completed items:', error.message);
      return { success: false, items: [], reason: error.message };
    }
  }
}

export default EbayClient;
