import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setError('Failed to load categories');
    }
  };

  const fetchCategoryData = async (categoryId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/category/${categoryId}`);
      const data = await res.json();
      if (data.success) {
        setCategoryData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    fetchCategoryData(category.id);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>TrendSpotter</h1>
          <p>eBay Category Analyzer</p>
        </div>
      </header>

      <div className="container">
        <div className="sidebar">
          <h2>Categories</h2>
          <div className="category-list">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-item ${selectedCategory?.id === cat.id ? 'active' : ''}`}
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

          {loading && (
            <div className="loading">Loading trending products...</div>
          )}

          {categoryData && !loading && (
            <>
              <div className="category-header">
                <h2>{categoryData.category.name}</h2>
                <p className="metadata">
                  {categoryData.metadata.cached ? (
                    <span className="cache-badge">Cached ({categoryData.metadata.cacheAge})</span>
                  ) : (
                    <span className="live-badge">Live Data</span>
                  )}
                  <span className="separator">•</span>
                  <span>Source: eBay Browse API</span>
                </p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Listings</div>
                  <div className="stat-value">{categoryData.stats.totalListings.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Average Price</div>
                  <div className="stat-value">${categoryData.stats.avgPrice.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Price Range</div>
                  <div className="stat-value">
                    ${categoryData.stats.minPrice.toFixed(2)} - ${categoryData.stats.maxPrice.toFixed(2)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Watchers</div>
                  <div className="stat-value">{categoryData.stats.totalWatchers.toLocaleString()}</div>
                </div>
              </div>

              <div className="table-container">
                <h3>Top 20 Trending Products (eBay Best Match)</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Condition</th>
                      <th>Seller</th>
                      <th>Engagement</th>
                      <th>Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.items.map((item, idx) => (
                      <tr key={item.itemId}>
                        <td>{idx + 1}</td>
                        <td className="product-cell">
                          <a href={item.itemUrl} target="_blank" rel="noopener noreferrer" className="product-link">
                            {item.itemId}
                          </a>
                        </td>
                        <td className="price-cell">
                          <span className="price">${item.price.toFixed(2)}</span>
                          {item.originalPrice && (
                            <span className="discount">
                              <span className="original-price">${item.originalPrice.toFixed(2)}</span>
                              <span className="discount-badge">-{item.discountPercent}%</span>
                            </span>
                          )}
                        </td>
                        <td>{item.condition}</td>
                        <td className="seller-cell">
                          <div>@{item.sellerUsername}</div>
                          <div className="seller-meta">{item.sellerFeedback} • {item.sellerRating.toFixed(1)}%</div>
                        </td>
                        <td className="engagement-cell">
                          {item.watchCount > 0 && <div>{item.watchCount} watching</div>}
                          {item.quantitySold > 0 && <div>{item.quantitySold} sold</div>}
                          {item.watchCount === 0 && item.quantitySold === 0 && <span className="muted">-</span>}
                        </td>
                        <td className="badges-cell">
                          {item.topRated && <span className="badge badge-toprated">Top Rated</span>}
                          {item.promoted && <span className="badge badge-promoted">Promoted</span>}
                          {item.freeShipping && <span className="badge badge-shipping">Free Ship</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="footer-note">
                All data sourced from official eBay Browse API. Click product IDs to verify on eBay.com.
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
