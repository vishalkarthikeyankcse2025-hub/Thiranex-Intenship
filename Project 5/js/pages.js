// ==========================================
// IMPORTS
// ==========================================

import {
    getProducts,
    getProductById,
    searchProducts,
    getCategories,
    getProductsByCategory
} from "./api.js";

import {
    setProducts,
    getProductsState,
    getCart,
    getCartTotal
} from "./state.js";

import {
    createProductCard,
    createProductDetails,
    createCartItem,
    createLoading,
    createError,
    createEmptyState
} from "./components.js";


// ==========================================
// HOME PAGE
// ==========================================

export async function renderHome(app) {

    app.innerHTML = `
        <section class="hero">

            <h1>
                Everything You Need
            </h1>

            <p>
                Explore our product catalog and
                discover your next favorite product.
            </p>

            <a
                href="/products"
                class="hero-button"
                data-link
            >
                Browse Products
            </a>

        </section>

        <section>

            <div class="page-header">

                <h1>
                    Featured Products
                </h1>

                <p>
                    A few products from our catalog.
                </p>

            </div>

            <div id="featured-products" class="product-grid">
                ${createLoading()}
            </div>

        </section>
    `;


    const featuredContainer =
        document.getElementById("featured-products");


    try {

        const products = await getProducts();

        setProducts(products);


        const featuredProducts =
            products.slice(0, 8);


        featuredContainer.innerHTML =
            featuredProducts
                .map(createProductCard)
                .join("");


    } catch (error) {

        featuredContainer.innerHTML =
            createError(error.message);
    }
}


// ==========================================
// PRODUCTS PAGE
// ==========================================

export async function renderProducts(app) {

    app.innerHTML = `
        <section>

            <div class="page-header">

                <h1>
                    Products
                </h1>

                <p>
                    Browse, search and filter our catalog.
                </p>

            </div>


            <div class="products-toolbar">

                <div class="search-box">

                    <input
                        type="search"
                        id="product-search"
                        placeholder="Search products..."
                    >

                </div>


                <select
                    id="category-select"
                    class="category-select"
                >

                    <option value="">
                        All Categories
                    </option>

                </select>

            </div>


            <div
                id="product-grid"
                class="product-grid"
            >
                ${createLoading()}
            </div>

        </section>
    `;


    const productGrid =
        document.getElementById("product-grid");

    const categorySelect =
        document.getElementById("category-select");


    try {

        // Get products
        const products =
            await getProducts();

        setProducts(products);


        // Render products
        productGrid.innerHTML =
            products
                .map(createProductCard)
                .join("");


        // Get categories
        const categories =
            await getCategories();


        categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category;

            option.textContent = category;

            categorySelect.appendChild(option);
        });


    } catch (error) {

        productGrid.innerHTML =
            createError(error.message);
    }
}


// ==========================================
// SEARCH PRODUCTS
// ==========================================

export async function handleProductSearch(query) {

    const productGrid =
        document.getElementById("product-grid");


    if (!productGrid) {
        return;
    }


    try {

        productGrid.innerHTML =
            createLoading();


        if (query.trim() === "") {

            const products =
                getProductsState();

            productGrid.innerHTML =
                products
                    .map(createProductCard)
                    .join("");

            return;
        }


        const products =
            await searchProducts(query);


        if (products.length === 0) {

            productGrid.innerHTML =
                createEmptyState(
                    "No products found",
                    "Try searching for a different product."
                );

            return;
        }


        productGrid.innerHTML =
            products
                .map(createProductCard)
                .join("");


    } catch (error) {

        productGrid.innerHTML =
            createError(error.message);
    }
}


// ==========================================
// CATEGORY FILTER
// ==========================================

export async function handleCategoryChange(category) {

    const productGrid =
        document.getElementById("product-grid");


    if (!productGrid) {
        return;
    }


    try {

        productGrid.innerHTML =
            createLoading();


        if (category === "") {

            const products =
                getProductsState();

            productGrid.innerHTML =
                products
                    .map(createProductCard)
                    .join("");

            return;
        }


        const products =
            await getProductsByCategory(category);


        if (products.length === 0) {

            productGrid.innerHTML =
                createEmptyState(
                    "No products found",
                    "There are no products in this category."
                );

            return;
        }


        productGrid.innerHTML =
            products
                .map(createProductCard)
                .join("");


    } catch (error) {

        productGrid.innerHTML =
            createError(error.message);
    }
}


// ==========================================
// PRODUCT DETAILS PAGE
// ==========================================

export async function renderProductDetails(app, id) {

    app.innerHTML =
        createLoading();


    try {

        const product =
            await getProductById(id);


        app.innerHTML = `
            <div class="page-header">

                <p>
                    <a
                        href="/products"
                        data-link
                    >
                        ← Back to Products
                    </a>
                </p>

            </div>

            ${createProductDetails(product)}
        `;


    } catch (error) {

        app.innerHTML =
            createError(error.message);
    }
}


// ==========================================
// CART PAGE
// ==========================================

export function renderCart(app) {

    const cart =
        getCart();


    app.innerHTML = `
        <section>

            <div class="page-header">

                <h1>
                    Shopping Cart
                </h1>

                <p>
                    Review the products you added.
                </p>

            </div>

        </section>
    `;


    if (cart.length === 0) {

        app.innerHTML +=
            createEmptyState(
                "Your cart is empty",
                "Add some products to your cart first."
            );

        return;
    }


    const cartItems =
        cart
            .map(createCartItem)
            .join("");


    const total =
        getCartTotal();


    app.innerHTML += `

        <div class="cart-list">
            ${cartItems}
        </div>


        <div class="cart-summary">

            <span>
                Total
            </span>

            <span class="cart-total">
                $${total.toFixed(2)}
            </span>

        </div>
    `;
}