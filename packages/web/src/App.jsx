import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [modalImage, setModalImage] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      setError("Failed to load categories");
    }
  };

  const fetchCategoryData = async (categoryId) => {
    setError(null);
    setSortConfig({ key: null, direction: "asc" });
    try {
      const res = await fetch(`${API_URL}/api/category/${categoryId}`);
      const data = await res.json();
      if (data.success) {
        setCategoryData(data);
        setLoading(false);
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to load category data");
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryData(null); // Clear old data
    setLoading(true); // Show skeleton
    // Fetch in background without blocking
    fetchCategoryData(category.id);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    if (!categoryData || !categoryData.items) return [];
    const items = [...categoryData.items];
    if (!sortConfig.key) return items;

    return items.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "index":
          aVal = categoryData.items.indexOf(a);
          bVal = categoryData.items.indexOf(b);
          break;
        case "price":
          aVal = a.price;
          bVal = b.price;
          break;
        case "engagement":
          aVal = (a.watchCount || 0) + (a.quantitySold || 0);
          bVal = (b.watchCount || 0) + (b.quantitySold || 0);
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return " ↕";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const calculatePromotedCount = () => {
    if (!categoryData || !categoryData.items) return 0;
    return categoryData.items.filter((item) => item.promoted).length;
  };

  const truncateWords = (str, maxWords) => {
    if (!str) return "";
    const words = str.split(" ");
    if (words.length <= maxWords) return str;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const formatReturnPolicy = (item) => {
    if (!item.returnsAccepted) return "No returns accepted";

    // Convert "30 CALENDAR_DAY" to "30 calendar day"
    const period = (item.returnPeriod || "Unknown period")
      .replace(/CALENDAR_DAY/g, "calendar day")
      .replace(/BUSINESS_DAY/g, "business day")
      .toLowerCase();

    const payer =
      item.returnShippingPayer === "BUYER"
        ? "buyer pays return shipping"
        : "seller pays return shipping";

    return `${period} returns, ${payer}`;
  };

  const formatCondition = (condition) => {
    const conditionMap = {
      "New other (see details)": "New, Unused, Minor Flaws",
      "New with tags": "New with tags",
      "New without tags": "New without tags",
      New: "New",
      Used: "Used",
      "Pre-Owned": "Pre-owned",
      Refurbished: "Refurbished",
      "For parts or not working": "For parts/not working",
    };
    return conditionMap[condition] || condition;
  };

  const formatShipToRegions = (regions) => {
    if (!regions || regions.length === 0) return null;

    const names = regions.map((r) => r.regionName || r);
    if (names.length <= 2) {
      return `Ships to: ${names.join(", ")}`;
    }

    return {
      summary: `Ships to: ${names.length} countries/regions`,
      full: names.join(", "),
    };
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  const getAllImages = (item) => {
    const images = [];
    if (item.imageUrl) images.push(item.imageUrl);
    if (item.additionalImages && item.additionalImages.length > 0) {
      item.additionalImages.forEach((img) => images.push(img.imageUrl));
    }
    return images;
  };

  const handleTooltipEnter = (event, text) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text: text,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 8,
    });
  };

  const handleTooltipLeave = () => {
    setTooltip({ show: false, text: "", x: 0, y: 0 });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>TrendSpotter</h1>
          <p>What's Hot on eBay</p>
        </div>
      </header>

      <div className="container">
        <div className="sidebar">
          <h2>Categories</h2>
          <div className="category-list">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-item ${
                  selectedCategory?.id === cat.id ? "active" : ""
                }`}
                onClick={() => handleCategorySelect(cat)}
              >
                <div className="category-name">{cat.name}</div>
                <div className="category-desc">{cat.description}</div>
              </button>
            ))}
          </div>
        </div>

        <main className="main-content">
          {!selectedCategory && (
            <div className="empty-state">
              <p>Select a category to view trending products</p>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <strong>Error:</strong> {error}
            </div>
          )}

          {selectedCategory && loading && (
            <>
              <div className="category-header">
                <h2>{selectedCategory.name}</h2>
                <p className="metadata">
                  <span className="skeleton skeleton-text" style={{ width: "200px" }}></span>
                </p>
              </div>

              <div className="stats-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="stat-card skeleton-card">
                    <div className="stat-label skeleton skeleton-text" style={{ width: "120px" }}></div>
                    <div className="stat-value skeleton skeleton-text" style={{ width: "80px", height: "28px" }}></div>
                  </div>
                ))}
              </div>

              <div className="table-wrapper">
                <div className="table-header">
                  <h3>Top 20 Trending Products</h3>
                  <p className="algorithm-note">
                    Shows the hottest items across all subcategories, ranked
                    internally by eBay's algorithm based on sales, popularity,
                    and seller quality
                  </p>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Images</th>
                        <th>Product Details</th>
                        <th>Price</th>
                        <th>Condition</th>
                        <th>Seller Information</th>
                        <th>Shipping Details</th>
                        <th>Return Policy</th>
                        <th>Availability</th>
                        <th>Ships From</th>
                        <th>Engagement</th>
                        <th>Status Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i}>
                          <td><div className="skeleton skeleton-text" style={{ width: "20px" }}></div></td>
                          <td><div className="skeleton skeleton-image"></div></td>
                          <td>
                            <div className="skeleton skeleton-text" style={{ width: "250px", marginBottom: "8px" }}></div>
                            <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
                          </td>
                          <td><div className="skeleton skeleton-text" style={{ width: "60px" }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: "80px" }}></div></td>
                          <td>
                            <div className="skeleton skeleton-text" style={{ width: "100px", marginBottom: "6px" }}></div>
                            <div className="skeleton skeleton-text" style={{ width: "90px" }}></div>
                          </td>
                          <td><div className="skeleton skeleton-text" style={{ width: "100px" }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: "140px" }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: "80px" }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: "100px" }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: "70px" }}></div></td>
                          <td><div className="skeleton skeleton-text" style={{ width: "90px" }}></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {categoryData && !loading && (
            <>
              <div className="category-header">
                <h2>{categoryData.category.name}</h2>
                <p className="metadata">
                  {categoryData.metadata.cached && (
                    <>
                      <span className="cache-badge">
                        {categoryData.metadata.cacheAge}
                      </span>
                      <span className="separator">•</span>
                    </>
                  )}
                  <span>Source: eBay Browse API</span>
                </p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Listings</div>
                  <div className="stat-value">
                    {categoryData.stats.totalListings.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Average Price</div>
                  <div className="stat-value">
                    ${categoryData.stats.avgPrice.toFixed(2)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Price Range</div>
                  <div className="stat-value">
                    ${categoryData.stats.minPrice.toFixed(2)} - $
                    {categoryData.stats.maxPrice.toFixed(2)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Promoted Listings</div>
                  <div className="stat-value">
                    {calculatePromotedCount()} /{" "}
                    {categoryData.stats.totalListings}
                  </div>
                </div>
              </div>

              <div className="table-wrapper">
                <div className="table-header">
                  <h3>Top 20 Trending Products</h3>
                  <p className="algorithm-note">
                    Shows the hottest items across all subcategories, ranked
                    internally by eBay's algorithm based on sales, popularity,
                    and seller quality
                  </p>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th
                          className="sortable"
                          onClick={() => handleSort("index")}
                        >
                          #{getSortIcon("index")}
                        </th>
                        <th>Images</th>
                        <th>Product Details</th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("price")}
                        >
                          Price{getSortIcon("price")}
                        </th>
                        <th>Condition</th>
                        <th>Seller Information</th>
                        <th>Shipping Details</th>
                        <th>Return Policy</th>
                        <th>Availability</th>
                        <th>Ships From</th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("engagement")}
                        >
                          Engagement{getSortIcon("engagement")}
                        </th>
                        <th>Status Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedItems().map((item) => {
                        const allImages = getAllImages(item);
                        const shipsTo = formatShipToRegions(
                          item.shipToLocations
                        );

                        return (
                          <tr key={item.itemId}>
                            <td className="rank-cell">
                              {categoryData.items.indexOf(item) + 1}
                            </td>
                            <td className="image-cell">
                              <div className="images-grid">
                                {allImages.map((imgUrl, idx) => (
                                  <img
                                    key={idx}
                                    src={imgUrl}
                                    alt={`${item.title} - Image ${idx + 1}`}
                                    className={`item-image ${
                                      idx === 0
                                        ? "main-image"
                                        : "thumbnail-image"
                                    }`}
                                    onClick={() => openImageModal(imgUrl)}
                                    title="Click to enlarge"
                                  />
                                ))}
                                {allImages.length === 0 && (
                                  <div className="no-image">No Image</div>
                                )}
                              </div>
                            </td>
                            <td className="product-cell">
                              <div className="product-title">{item.title}</div>
                              <a
                                href={item.itemUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="product-link"
                              >
                                Item ID: {item.itemId}
                              </a>
                              {item.shortDescription && (
                                <div className="product-desc">
                                  {item.shortDescription}
                                </div>
                              )}
                            </td>
                            <td className="price-cell">
                              <div className="price-main">
                                ${item.price.toFixed(2)}
                              </div>
                              {item.originalPrice && (
                                <div className="price-discount">
                                  <span className="original-price">
                                    Was ${item.originalPrice.toFixed(2)}
                                  </span>
                                  <span className="discount-badge">
                                    Save {item.discountPercent}%
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="condition-cell">
                              {formatCondition(item.condition)}
                            </td>
                            <td className="seller-cell">
                              <div className="seller-name">
                                @{item.sellerUsername}
                              </div>
                              <div className="seller-stats">
                                <div>
                                  {item.sellerFeedback.toLocaleString()} ratings
                                </div>
                                <div>
                                  {item.sellerRating.toFixed(1)}% positive
                                </div>
                              </div>
                            </td>
                            <td className="shipping-cell">
                              {!item.freeShipping && item.shippingCost && (
                                <div className="ship-cost">
                                  {item.shippingCost} shipping
                                </div>
                              )}
                              {item.shippingType && (
                                <div className="ship-type">
                                  {item.shippingType}
                                </div>
                              )}
                              {shipsTo && typeof shipsTo === "object" ? (
                                <div
                                  className="ship-regions ship-regions-hoverable"
                                  onMouseEnter={(e) =>
                                    handleTooltipEnter(e, shipsTo.full)
                                  }
                                  onMouseLeave={handleTooltipLeave}
                                >
                                  {shipsTo.summary}
                                </div>
                              ) : (
                                shipsTo && (
                                  <div className="ship-regions">{shipsTo}</div>
                                )
                              )}
                            </td>
                            <td className="returns-cell">
                              <div
                                className={
                                  item.returnsAccepted
                                    ? "returns-yes"
                                    : "returns-no"
                                }
                              >
                                {formatReturnPolicy(item)}
                              </div>
                            </td>
                            <td className="stock-cell">
                              {item.estimatedAvailableQuantity ? (
                                item.estimatedAvailableQuantity <= 10 ? (
                                  <span className="stock-low">
                                    Only {item.estimatedAvailableQuantity} in
                                    stock
                                  </span>
                                ) : (
                                  <span className="stock-ok">
                                    {item.estimatedAvailableQuantity} in stock
                                  </span>
                                )
                              ) : item.estimatedRemainingQuantity ? (
                                item.estimatedRemainingQuantity <= 10 ? (
                                  <span className="stock-low">
                                    Only {item.estimatedRemainingQuantity}{" "}
                                    remaining
                                  </span>
                                ) : (
                                  <span className="stock-ok">
                                    {item.estimatedRemainingQuantity} remaining
                                  </span>
                                )
                              ) : item.availabilityThreshold ? (
                                item.availabilityThresholdType ===
                                "MORE_THAN" ? (
                                  <span className="stock-ok">
                                    {item.availabilityThreshold}+ in stock
                                  </span>
                                ) : (
                                  <span className="stock-low">
                                    Only {item.availabilityThreshold} left!
                                  </span>
                                )
                              ) : (
                                <span className="stock-ok">In stock</span>
                              )}
                            </td>
                            <td className="location-cell">
                              {item.itemLocation || (
                                <span className="muted">Not specified</span>
                              )}
                            </td>
                            <td className="engagement-cell">
                              <div className="engagement-content">
                                {item.watchCount > 0 && (
                                  <div className="watchers">
                                    {item.watchCount} watching
                                  </div>
                                )}
                                {item.quantitySold > 0 && (
                                  <div className="sold">
                                    {item.quantitySold} sold
                                  </div>
                                )}
                                {item.watchCount === 0 &&
                                  item.quantitySold === 0 && (
                                    <span className="muted">No data</span>
                                  )}
                              </div>
                            </td>
                            <td className="badges-cell">
                              <div className="badges-content">
                                {item.freeShipping && (
                                  <span className="badge badge-shipping">
                                    Free Shipping
                                  </span>
                                )}
                                {item.topRated && (
                                  <span className="badge badge-toprated">
                                    Top Rated Seller
                                  </span>
                                )}
                                {item.promoted && (
                                  <span className="badge badge-promoted">
                                    Promoted Listing
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="footer-note">
                All data sourced from official eBay Browse API. Click product
                IDs to verify on eBay.com. Click images to enlarge.
              </div>
            </>
          )}
        </main>
      </div>

      {tooltip.show &&
        createPortal(
          <div
            className="ship-regions-tooltip-portal"
            style={{
              position: "absolute",
              left: tooltip.x + "px",
              top: tooltip.y + "px",
              transform: "translateY(-100%)",
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}

      {modalImage && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={modalImage}
              alt="Enlarged product"
              className="modal-image"
            />
            <button className="modal-close" onClick={closeImageModal}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
