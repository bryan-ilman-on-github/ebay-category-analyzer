import EbayClient from './src/api/ebayClient.js';

const client = new EbayClient();
const token = await client.getAccessToken();

console.log('Making direct curl to eBay API...\n');

const itemId = 'v1|177284475542|476950375129';
const url = `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(itemId)}`;

const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
  }
});

const data = await response.json();

console.log('Direct eBay API response:');
console.log('  URL:', url);
console.log('  watchCount:', data.watchCount);
console.log('  estimatedAvailabilities:', JSON.stringify(data.estimatedAvailabilities, null, 2));
