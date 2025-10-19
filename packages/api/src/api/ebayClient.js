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
        // Default sort = "Best Match" - eBay's algorithm for popular/relevant items
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
   * Get detailed item info including watch count, quantity sold
   * @param {string} itemId - Item ID from search results
   */
  async getItemDetails(itemId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${EBAY_BROWSE_API_URL}/item/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.marketplace,
        },
      });

      const data = response.data;

      // Log availability fields for debugging (first item only)
      if (!this._loggedAvailability) {
        console.log('eBay API fields for item:', itemId);
        console.log('  watchCount:', data.watchCount);
        console.log('  estimatedAvailabilities:', JSON.stringify(data.estimatedAvailabilities, null, 2));
        console.log('  quantityLimitPerBuyer:', data.quantityLimitPerBuyer);
        this._loggedAvailability = true;
      }

      return data;

    } catch (error) {
      console.warn(`Could not fetch details for item ${itemId}:`, error.message);
      return null;
    }
  }

  /**
   * Get item group details and aggregate data across all variations
   */
  async getItemGroupDetails(itemGroupId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${EBAY_BROWSE_API_URL}/item/get_items_by_item_group`, {
        params: { item_group_id: itemGroupId },
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.marketplace,
        },
      });

      const data = response.data;

      if (!data.items || data.items.length === 0) {
        return null;
      }

      // Aggregate across all variations
      const allVariations = data.items;

      // Find cheapest price
      const cheapestVariation = allVariations.reduce((min, item) => {
        const price = parseFloat(item.price?.value || Infinity);
        const minPrice = parseFloat(min.price?.value || Infinity);
        return price < minPrice ? item : min;
      }, allVariations[0]);

      // Sum total sold quantity across all variations
      const totalSold = allVariations.reduce((sum, item) => {
        return sum + (item.estimatedAvailabilities?.[0]?.estimatedSoldQuantity || 0);
      }, 0);

      // Sum total remaining quantity
      const totalRemaining = allVariations.reduce((sum, item) => {
        return sum + (item.estimatedAvailabilities?.[0]?.estimatedRemainingQuantity || 0);
      }, 0);

      // Return aggregated data using cheapest variation as base
      return {
        ...cheapestVariation,
        // Override with aggregated quantities
        estimatedAvailabilities: [{
          ...cheapestVariation.estimatedAvailabilities?.[0],
          estimatedSoldQuantity: totalSold,
          estimatedRemainingQuantity: totalRemaining,
        }],
      };

    } catch (error) {
      console.warn(`Could not fetch item group ${itemGroupId}:`, error.message);
      return null;
    }
  }

  /**
   * Enrich item summaries with detailed data (watchCount, quantitySold, etc.)
   */
  async enrichItemsWithDetails(items) {
    console.log('Fetching detailed data for items...');

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let details = await this.getItemDetails(item.itemId);

        // If this is an item group (has variations), fetch aggregated data
        if (details?.primaryItemGroup?.itemGroupId) {
          const groupDetails = await this.getItemGroupDetails(details.primaryItemGroup.itemGroupId);
          if (groupDetails) {
            details = groupDetails;
          }
        }

        if (details) {
          return {
            ...item,
            // Engagement data
            watchCount: details.watchCount,
            quantitySold: details.estimatedAvailabilities?.[0]?.estimatedSoldQuantity,

            // Price (use cheapest from variations)
            price: details.price,
            marketingPrice: details.marketingPrice,

            // Images - check both additionalImages and images fields
            imageUrl: details.image?.imageUrl || item.image?.imageUrl,
            additionalImages: details.additionalImages || details.images || [],

            // Item details
            title: details.title || item.title,
            shortDescription: details.shortDescription,
            categoryPath: details.categoryPath,

            // Shipping
            shippingCost: details.shippingOptions?.[0]?.shippingCost,
            shippingType: details.shippingOptions?.[0]?.type,
            shipToLocations: details.shipToLocations?.regionIncluded,

            // Return policy
            returnsAccepted: details.returnTerms?.returnsAccepted,
            returnPeriod: details.returnTerms?.returnPeriod?.value + ' ' + details.returnTerms?.returnPeriod?.unit,
            returnShippingPayer: details.returnTerms?.returnShippingCostPayer,

            // Availability/Stock
            availabilityThreshold: details.estimatedAvailabilities?.[0]?.availabilityThreshold,
            availabilityThresholdType: details.estimatedAvailabilities?.[0]?.availabilityThresholdType,
            estimatedAvailableQuantity: details.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity,
            estimatedRemainingQuantity: details.estimatedAvailabilities?.[0]?.estimatedRemainingQuantity,
            deliveryOptions: details.estimatedAvailabilities?.[0]?.deliveryOptions,

            // Location
            itemLocationCity: details.itemLocation?.city,
            itemLocationState: details.itemLocation?.stateOrProvince,
            itemLocationCountry: details.itemLocation?.country,
          };
        }

        return item;
      })
    );

    return enrichedItems;
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
