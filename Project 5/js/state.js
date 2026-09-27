// ==========================================
// APPLICATION STATE
// ==========================================

let products = [];


// ==========================================
// CART STORAGE KEY
// ==========================================

const CART_STORAGE_KEY = "shoply-cart";


// ==========================================
// LOAD CART FROM LOCAL STORAGE
// ==========================================

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(CART_STORAGE_KEY);

        return savedCart
            ? JSON.parse(savedCart)
            : [];

    } catch (error) {

        console.error(
            "Failed to load cart:",
            error
        );

        return [];
    }
}


// ==========================================
// SAVE CART TO LOCAL STORAGE
// ==========================================

function saveCart() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Failed to save cart:",
            error
        );
    }
}


// ==========================================
// CART STATE
// ==========================================

let cart = loadCart();


// ==========================================
// SET PRODUCTS
// ==========================================

export function setProducts(newProducts) {

    products = newProducts;
}


// ==========================================
// GET PRODUCTS
// ==========================================

export function getProductsState() {

    return products;
}


// ==========================================
// ADD TO CART
// ==========================================

export function addToCart(product) {

    const existingProduct =
        cart.find(
            item => item.id === product.id
        );


    if (existingProduct) {

        existingProduct.quantity += 1;

    } else {

        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: 1
        });
    }


    saveCart();
}


// ==========================================
// REMOVE FROM CART
// ==========================================

export function removeFromCart(productId) {

    cart = cart.filter(
        item => item.id !== productId
    );

    saveCart();
}


// ==========================================
// GET CART
// ==========================================

export function getCart() {

    return cart;
}


// ==========================================
// GET CART COUNT
// ==========================================

export function getCartCount() {

    return cart.reduce(
        (total, item) =>
            total + item.quantity,
        0
    );
}


// ==========================================
// GET CART TOTAL
// ==========================================

export function getCartTotal() {

    return cart.reduce(
        (total, item) =>
            total + (item.price * item.quantity),
        0
    );
}


// ==========================================
// CLEAR CART
// ==========================================

export function clearCart() {

    cart = [];

    saveCart();
}