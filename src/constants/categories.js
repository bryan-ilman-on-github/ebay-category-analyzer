/**
 * eBay Category IDs (Official)
 * Source: https://developer.ebay.com/DevZone/finding/CallRef/Enums/categoryIdList.html
 * These are real eBay category IDs used in their API
 */

export const CATEGORIES = {
  ELECTRONICS: {
    id: '293',
    name: 'Consumer Electronics',
    description: 'Cameras, TV, Audio, GPS, Smart Home',
  },
  FASHION_WOMEN: {
    id: '15724',
    name: 'Women\'s Clothing',
    description: 'Dresses, Tops, Activewear, Shoes',
  },
  FASHION_MEN: {
    id: '1059',
    name: 'Men\'s Clothing',
    description: 'Shirts, Pants, Shoes, Accessories',
  },
  HOME_GARDEN: {
    id: '11700',
    name: 'Home & Garden',
    description: 'Furniture, Kitchen, Bedding, Garden',
  },
  COLLECTIBLES: {
    id: '1',
    name: 'Collectibles',
    description: 'Trading Cards, Vintage, Memorabilia',
  },
  TOYS: {
    id: '220',
    name: 'Toys & Hobbies',
    description: 'Action Figures, Models, Games',
  },
  SPORTING_GOODS: {
    id: '888',
    name: 'Sporting Goods',
    description: 'Fitness, Outdoor Sports, Team Sports',
  },
  JEWELRY: {
    id: '281',
    name: 'Jewelry & Watches',
    description: 'Fine Jewelry, Fashion Jewelry, Watches',
  },
  HEALTH_BEAUTY: {
    id: '26395',
    name: 'Health & Beauty',
    description: 'Makeup, Skincare, Fragrance, Hair Care',
  },
  AUTOMOTIVE: {
    id: '6000',
    name: 'eBay Motors',
    description: 'Parts, Accessories, Motorcycle, Tools',
  },
  BOOKS: {
    id: '267',
    name: 'Books, Movies & Music',
    description: 'Books, DVDs, Vinyl, CDs',
  },
  BUSINESS: {
    id: '12576',
    name: 'Business & Industrial',
    description: 'Healthcare, Lab Equipment, Office',
  },
};

/**
 * Get category by ID
 */
export function getCategoryById(id) {
  return Object.values(CATEGORIES).find(cat => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds() {
  return Object.values(CATEGORIES).map(cat => cat.id);
}

/**
 * Get category choices for CLI (formatted for inquirer)
 */
export function getCategoryChoices() {
  return Object.values(CATEGORIES).map(cat => ({
    name: `${cat.name} - ${cat.description}`,
    value: cat.id,
    short: cat.name,
  }));
}

export default CATEGORIES;
