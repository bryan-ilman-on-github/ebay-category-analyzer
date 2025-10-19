/**
 * eBay Category IDs (Official)
 * Matches eBay's official top-level categories from https://www.ebay.com/n/all-categories
 * Category IDs sourced from eBay Browse API documentation
 */

export const CATEGORIES = {
  MOTORS: {
    id: '6000',
    name: 'eBay Motors',
    description: 'Parts, Accessories, Cars, Motorcycles',
  },
  ELECTRONICS: {
    id: '293',
    name: 'Electronics',
    description: 'Cameras, TV, Audio, Computers, Smart Home',
  },
  COLLECTIBLES: {
    id: '1',
    name: 'Collectibles & Art',
    description: 'Trading Cards, Vintage, Art, Memorabilia',
  },
  HOME_GARDEN: {
    id: '11700',
    name: 'Home & Garden',
    description: 'Furniture, Kitchen, Bedding, Garden Tools',
  },
  CLOTHING: {
    id: '11450',
    name: 'Clothing, Shoes & Accessories',
    description: 'Men\'s, Women\'s, Kids, Shoes, Accessories',
  },
  TOYS: {
    id: '220',
    name: 'Toys & Hobbies',
    description: 'Action Figures, Models, Games, RC',
  },
  SPORTING_GOODS: {
    id: '888',
    name: 'Sporting Goods',
    description: 'Fitness, Outdoor, Cycling, Team Sports',
  },
  BOOKS: {
    id: '267',
    name: 'Books, Movies & Music',
    description: 'Books, DVDs, Vinyl, CDs, Video Games',
  },
  HEALTH_BEAUTY: {
    id: '26395',
    name: 'Health & Beauty',
    description: 'Makeup, Skincare, Fragrance, Vitamins',
  },
  BUSINESS: {
    id: '12576',
    name: 'Business & Industrial',
    description: 'Healthcare, Lab, Office, Construction',
  },
  JEWELRY: {
    id: '281',
    name: 'Jewelry & Watches',
    description: 'Fine Jewelry, Fashion Jewelry, Watches',
  },
  BABY: {
    id: '2984',
    name: 'Baby Essentials',
    description: 'Clothing, Gear, Feeding, Nursery',
  },
  PETS: {
    id: '1281',
    name: 'Pet Supplies',
    description: 'Dog, Cat, Fish, Bird, Small Animals',
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
