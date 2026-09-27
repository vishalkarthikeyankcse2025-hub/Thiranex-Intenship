// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE_URL = "https://dummyjson.com";


// ==========================================
// GET ALL PRODUCTS
// ==========================================

export async function getProducts() {

    const response = await fetch(
        `${API_BASE_URL}/products?limit=30`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch products.");
    }

    const data = await response.json();

    return data.products;
}


// ==========================================
// GET SINGLE PRODUCT
// ==========================================

export async function getProductById(id) {

    const response = await fetch(
        `${API_BASE_URL}/products/${id}`
    );

    if (!response.ok) {
        throw new Error("Product not found.");
    }

    const product = await response.json();

    return product;
}


// ==========================================
// SEARCH PRODUCTS
// ==========================================

export async function searchProducts(query) {

    const response = await fetch(
        `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
        throw new Error("Failed to search products.");
    }

    const data = await response.json();

    return data.products;
}


// ==========================================
// GET PRODUCT CATEGORIES
// ==========================================

export async function getCategories() {

    const response = await fetch(
        `${API_BASE_URL}/products/category-list`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch categories.");
    }

    const categories = await response.json();

    return categories;
}


// ==========================================
// GET PRODUCTS BY CATEGORY
// ==========================================

export async function getProductsByCategory(category) {

    const response = await fetch(
        `${API_BASE_URL}/products/category/${encodeURIComponent(category)}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch category products.");
    }

    const data = await response.json();

    return data.products;
}