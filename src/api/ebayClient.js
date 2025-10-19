import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EBAY_BROWSE_API_URL = 'https://api.ebay.com/buy/browse/v1';
const EBAY_OAUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

class EbayClient {
  constructor() {
    this.appId = process.env.EBAY_APP_ID;
    this.certId = process.env.EBAY_CERT_ID;
    this.marketplace = process.env.EBAY_MARKETPLACE || 'EBAY_US';
    this.accessToken = null;
    this.tokenExpiry = null;

    if (!this.appId || !this.certId) {
      throw new Error('EBAY_APP_ID and EBAY_CERT_ID are required. Please set them in .env file');
    }
  }

  /**
   * Get OAuth access token (client credentials flow)
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64');

      const response = await axios.post(
        EBAY_OAUTH_URL,
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;

    } catch (error) {
      console.error('OAuth error:', error.response?.data || error.message);
      throw new Error('Failed to get OAuth token. Check your EBAY_APP_ID and EBAY_CERT_ID.');
    }
  }

  /**
   * Fetches trending products from a specific category
   * Uses eBay's Browse API - all data is real and verifiable
   * @param {string} categoryId - eBay category ID
   * @param {number} limit - Number of items to fetch (max 200)
   * @returns {Promise<Object>} API response with metadata for credibility
   */
  async findItemsByCategory(categoryId, limit = 20) {
    try {
      const token = await this.getAccessToken();

      const params = {
        category_ids: categoryId,
        limit: Math.min(limit, 200),
        sort: 'newlyListed',
        filter: 'price:[1..],buyingOptions:{FIXED_PRICE}',
      };

      const response = await axios.get(`${EBAY_BROWSE_API_URL}/item_summary/search`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.marketplace,
          'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=US',
        },
      });

      const data = response.data;

      if (!data.itemSummaries || data.itemSummaries.length === 0) {
        throw new Error('No items found in this category');
      }

      return {
        success: true,
        items: data.itemSummaries,
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || 0,
        categoryId,
        source: 'eBay Browse API (Official)',
        apiEndpoint: EBAY_BROWSE_API_URL,
        timestamp: new Date().toISOString(),
        metadata: {
          ack: 'Success',
          timestamp: new Date().toISOString(),
          totalPages: Math.ceil((data.total || 0) / limit),
        }
      };

    } catch (error) {
      console.error('Error fetching eBay data:', error.response?.data || error.message);
      throw new Error(`Failed to fetch data from eBay: ${error.message}`);
    }
  }

  /**
   * Get completed/sold listings to analyze price trends
   * Browse API doesn't support sold items search, so we return empty
   */
  async findCompletedItems(categoryId, limit = 20) {
    // Browse API doesn't have a direct equivalent for sold items
    // This would require the Trading API or third-party data
    console.warn('Sold items data not available in Browse API');
    return { success: false, items: [], reason: 'Browse API does not support sold items search' };
  }
}

export default EbayClient;
