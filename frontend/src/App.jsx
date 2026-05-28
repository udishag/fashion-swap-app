import React from 'react';

// 1. Importing your local assets using your exact file names and extensions
import pinstripeItem from './assets/miniskirt.jpg';
import pinstripeStyle from './assets/minimodel.jpg';
import chiffonItem from './assets/chiffskirt.jpg';
import chiffonStyle from './assets/chiffmodel.png'; // Noticed this one is a .png!

const MOCK_PRODUCTS = [
  {
    id: 1,
    title: "pinstripe tailored micro",
    category: "skirts",
    price: "trade",
    img1: pinstripeItem,
    img2: pinstripeStyle
  },
  {
    id: 2,
    title: "ruched soft chiffon mini",
    category: "skirts",
    price: "trade",
    img1: chiffonItem,
    img2: chiffonStyle
  },
  {
    id: 3,
    title: "asymmetrical plaid maxi",
    category: "skirts",
    price: "trade",
    // Keeping these two stable online CDN links active for your third item set
    img1: "https://i.pinimg.com/originals/f7/75/fd/f775fd0ad30055091b620796554b1558.jpg",
    img2: "https://i.pinimg.com/originals/b5/a7/4b/b5a74b507a8ff6e58bfcdfe73bb6d431.jpg"
  }
];
function App() {
  return (
    <div>
      <button className="floating-side-waitlist">join the waitlist</button>
      {/* Rhode Minimalist Navbar */}
      <nav className="navbar">
        <div className="brand-logo">moss.</div>
        <div className="nav-links">
          <a href="#shop">shop</a>
          <a href="#exchange">exchange</a>
          <a href="#about">about</a>
        </div>
      </nav>

      {/* Main Layout Workspace */}
      <main className="main-container">
        <header className="hero-section">
          <h1>your wardrobe, timeless</h1>
          <p>the non-monetary network redesigning how we pass on style.</p>
        </header>

        {/* Product Grid */}
        <section className="product-grid" id="shop">
          {MOCK_PRODUCTS.map((product) => (
            <div key={product.id} className="product-card">
              <div className="image-container">
                <img
                  src={product.img1}
                  alt={product.title}
                  className="product-image default-img"
                />
                <img
                  src={product.img2}
                  alt={`${product.title} alternative view`}
                  className="product-image hover-img"
                />
              </div>
              <div className="product-info">
                <div>
                  <h3 className="product-title">{product.title}</h3>
                  <p className="product-category">{product.category}</p>
                </div>
                <span className="product-price">{product.price}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;