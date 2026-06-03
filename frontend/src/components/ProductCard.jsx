import React, { useState } from 'react';

const ProductCard = ({ product }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="product-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="product-card-image-wrapper">
                <img
                    src={hovered ? product.styledImage : product.clothImage}
                    alt={product.title}
                />
            </div>

            <div className="product-card-meta">
                <h4 className="product-card-title">{product.title}</h4>
                <p className="product-card-subtitle">
                    {product.brand} — {parseFloat(product.credits).toFixed(1)} credits
                </p>
            </div>
        </div>
    );
};

export default ProductCard;