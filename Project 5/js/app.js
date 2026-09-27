// ==========================================
// IMPORTS
// ==========================================

import { router } from "./router.js";

import { addToCart, removeFromCart, getCartCount } from "./state.js";

import { handleProductSearch, handleCategoryChange } from "./pages.js";

// ==========================================
// CART COUNT
// ==========================================

function updateCartCount() {
  const cartCount = document.getElementById("cart-count");

  if (!cartCount) {
    return;
  }

  cartCount.textContent = getCartCount();
}

// ==========================================
// CART TOAST
// ==========================================

let toastTimer;

function showCartToast(message) {
  let toast = document.querySelector(".cart-toast");

  // Create toast if it doesn't exist
  if (!toast) {
    toast = document.createElement("div");

    toast.className = "cart-toast";

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  // Show toast
  toast.classList.add("show");

  // Clear previous timer
  clearTimeout(toastTimer);

  // Hide after 2 seconds
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// ==========================================
// GLOBAL CLICK EVENTS
// ==========================================

document.addEventListener("click", async function (event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  const id = Number(button.dataset.id);

  // --------------------------------------
  // ADD TO CART
  // --------------------------------------

  if (action === "add-cart") {
    try {
      const response = await fetch(`https://dummyjson.com/products/${id}`);

      if (!response.ok) {
        throw new Error("Failed to add product to cart.");
      }

      const product = await response.json();

      addToCart(product);

      updateCartCount();

      showCartToast(`${product.title} added to cart`);

      // Temporary button feedback
      const originalText = button.textContent;

      button.textContent = "Added ✓";

      button.disabled = true;

      setTimeout(() => {
        button.textContent = originalText;

        button.disabled = false;
      }, 1000);
    } catch (error) {
      console.error("Add to cart error:", error);

      showCartToast("Unable to add product to cart.");
    }

    return;
  }

  // --------------------------------------
  // REMOVE FROM CART
  // --------------------------------------

  if (action === "remove-cart") {
    removeFromCart(id);

    updateCartCount();

    router();

    return;
  }
});

// ==========================================
// DEBOUNCE
// ==========================================

function debounce(callback, delay) {
  let timer;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

// ==========================================
// DEBOUNCED SEARCH
// ==========================================

const debouncedSearch = debounce(function (query) {
  handleProductSearch(query);
}, 400);

// ==========================================
// SEARCH EVENT
// ==========================================

document.addEventListener("input", function (event) {
  if (event.target.id !== "product-search") {
    return;
  }

  debouncedSearch(event.target.value);
});

// ==========================================
// CATEGORY EVENT
// ==========================================

document.addEventListener("change", function (event) {
  if (event.target.id !== "category-select") {
    return;
  }

  handleCategoryChange(event.target.value);
});

// ==========================================
// UPDATE CART COUNT
// ==========================================

updateCartCount();

// ==========================================
// INITIAL ROUTE
// ==========================================

router();
