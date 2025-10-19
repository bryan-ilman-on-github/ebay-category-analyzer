import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import EbayClient from "./src/api/ebayClient.js";
import { TrendAnalyzer } from "./src/utils/trendAnalyzer.js";
import { CacheManager } from "./src/utils/cache.js";
import { CATEGORIES, getCategoryById } from "@ebay-analyzer/shared/categories";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      "https://ebay-category-analyzer-web.vercel.app",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json());

const ebayClient = new EbayClient();
const analyzer = new TrendAnalyzer();
const cache = new CacheManager();

/**
 * Format cache age as "Cached X hour(s) Y minutes ago"
 */
function formatCacheAge(ageInHours) {
  const totalMinutes = Math.floor(ageInHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 1) {
    const hourText = hours === 1 ? "hour" : "hours";
    const minuteText = minutes === 1 ? "minute" : "minutes";
    return `Cached ${hours} ${hourText} ${minutes} ${minuteText} ago`;
  } else {
    const minuteText = minutes === 1 ? "minute" : "minutes";
    return `Cached ${minutes} ${minuteText} ago`;
  }
}

/**
 * GET /api/categories
 * Returns list of all available categories
 */
app.get("/api/categories", (req, res) => {
  const categories = Object.values(CATEGORIES).map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
  }));
  res.json({ success: true, categories });
});

/**
 * GET /api/category/:id
 * Returns trending items for a specific category
 */
app.get("/api/category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = getCategoryById(id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    const cacheKey = `category_${id}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      const age = cache.getCacheAge(cacheKey);
      return res.json({
        success: true,
        category,
        items: cached.items.map((item) => analyzer.extractMetrics(item)),
        stats: analyzer.calculateCategoryStats(cached.items),
        metadata: {
          ...cached.metadata,
          cached: true,
          cacheAge: formatCacheAge(age),
        },
      });
    }

    // Fetch fresh data
    const activeData = await ebayClient.findItemsByCategory(id, 20);

    if (!activeData.success) {
      throw new Error("Failed to fetch category data from eBay");
    }

    // Enrich with detailed data
    const enrichedItems = await ebayClient.enrichItemsWithDetails(
      activeData.items
    );

    const result = {
      ...activeData,
      items: enrichedItems,
    };

    // Cache the result
    cache.set(cacheKey, result);

    // Return formatted data
    res.json({
      success: true,
      category,
      items: enrichedItems.map((item) => analyzer.extractMetrics(item)),
      stats: analyzer.calculateCategoryStats(enrichedItems),
      metadata: {
        ...result.metadata,
        cached: false,
      },
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TrendSpotter API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
