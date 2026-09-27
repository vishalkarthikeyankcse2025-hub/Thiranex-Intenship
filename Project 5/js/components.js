// ==========================================
// PRODUCT CARD
// ==========================================

export function createProductCard(product) {
  return `
        <article class="product-card">

            <a
                href="/product/${product.id}"
                data-link
            >
                <img
                    src="${product.thumbnail}"
                    alt="${product.title}"
                    class="product-image"
                    loading="lazy"
                >
            </a>

            <div class="product-info">

                <span class="product-category">
                    ${product.category}
                </span>

                <a
                    href="/product/${product.id}"
                    class="product-title"
                    data-link
                >
                    ${product.title}
                </a>

                <p class="product-description">
                    ${product.description}
                </p>

                <div class="product-bottom">

                    <span class="product-price">
                        $${product.price.toFixed(2)}
                    </span>

                    <span class="product-rating">
                        ★ ${product.rating}
                    </span>

                </div>

                <button
                    type="button"
                    class="product-button"
                    data-action="add-cart"
                    data-id="${product.id}"
                >
                    Add to Cart
                </button>

            </div>

        </article>
    `;
}

// ==========================================
// PRODUCT DETAILS
// ==========================================

export function createProductDetails(product) {
  return `
        <section class="product-details">

            <img
                src="${product.images[0]}"
                alt="${product.title}"
                class="product-details-image"
            >


            <div class="product-details-info">

                <span class="product-category">
                    ${product.category}
                </span>

                <h1>
                    ${product.title}
                </h1>

                <p class="details-price">
                    $${product.price.toFixed(2)}
                </p>

                <p class="details-description">
                    ${product.description}
                </p>


                <div class="details-meta">

                    <span>
                        Brand:
                        ${product.brand || "Not specified"}
                    </span>

                    <span>
                        Rating:
                        ★ ${product.rating}
                    </span>

                    <span>
                        Stock:
                        ${product.stock}
                    </span>

                    <span>
                        Discount:
                        ${product.discountPercentage.toFixed(1)}%
                    </span>

                </div>


                <button
                    type="button"
                    class="product-button"
                    data-action="add-cart"
                    data-id="${product.id}"
                >
                    Add to Cart
                </button>

            </div>

        </section>
    `;
}

// ==========================================
// CART ITEM
// ==========================================

export function createCartItem(item) {
  const subtotal = item.price * item.quantity;

  return `
        <article
            class="cart-item"
            data-id="${item.id}"
        >

            <img
                src="${item.thumbnail}"
                alt="${item.title}"
                class="cart-item-image"
            >


            <div class="cart-item-info">

                <h3>
                    ${item.title}
                </h3>

                <p>
                    $${item.price.toFixed(2)}
                    × ${item.quantity}
                </p>

                <p>
                    Subtotal:
                    $${subtotal.toFixed(2)}
                </p>

            </div>


            <button
                type="button"
                class="remove-cart-button"
                data-action="remove-cart"
                data-id="${item.id}"
            >
                Remove
            </button>

        </article>
    `;
}

// ==========================================
// LOADING COMPONENT
// ==========================================

export function createLoading() {
  return `
        <div class="loading">
            Loading...
        </div>
    `;
}

// ==========================================
// ERROR COMPONENT
// ==========================================

export function createError(message) {
  return `
        <div class="error-state">
            ${message}
        </div>
    `;
}

// ==========================================
// EMPTY STATE
// ==========================================

export function createEmptyState(title, message) {
  return `
        <div class="empty-state">

            <h2>
                ${title}
            </h2>

            <p>
                ${message}
            </p>

        </div>
    `;
}
