// ==========================================
// IMPORT PAGE FUNCTIONS
// ==========================================

import {
    renderHome,
    renderProducts,
    renderProductDetails,
    renderCart
} from "./pages.js";


// ==========================================
// ROUTE CURRENT URL
// ==========================================

export async function router() {

    const app =
        document.getElementById("app");

    const path =
        window.location.pathname;


    // --------------------------------------
    // HOME
    // --------------------------------------

    if (path === "/" || path === "/index.html") {

        await renderHome(app);

        return;
    }


    // --------------------------------------
    // PRODUCTS
    // --------------------------------------

    if (path === "/products") {

        await renderProducts(app);

        return;
    }


    // --------------------------------------
    // PRODUCT DETAILS
    // --------------------------------------

    if (path.startsWith("/product/")) {

        const id =
            path.split("/")[2];

        if (!id) {

            app.innerHTML = `
                <div class="error-state">
                    Product ID is missing.
                </div>
            `;

            return;
        }

        await renderProductDetails(app, id);

        return;
    }


    // --------------------------------------
    // CART
    // --------------------------------------

    if (path === "/cart") {

        renderCart(app);

        return;
    }


    // --------------------------------------
    // 404
    // --------------------------------------

    app.innerHTML = `
        <section class="empty-state">

            <h2>
                Page not found
            </h2>

            <p>
                The page you are looking for does not exist.
            </p>

            <a
                href="/"
                class="hero-button"
                data-link
            >
                Go Home
            </a>

        </section>
    `;
}


// ==========================================
// CLIENT-SIDE NAVIGATION
// ==========================================

export function navigateTo(url) {

    history.pushState(
        {},
        "",
        url
    );

    router();
}


// ==========================================
// HANDLE NAVIGATION CLICKS
// ==========================================

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest("[data-link]");


        if (!link) {
            return;
        }


        const href =
            link.getAttribute("href");


        // Ignore external links
        if (
            !href ||
            href.startsWith("http") ||
            href.startsWith("#")
        ) {
            return;
        }


        event.preventDefault();

        navigateTo(href);
    }
);


// ==========================================
// BROWSER BACK / FORWARD
// ==========================================

window.addEventListener(
    "popstate",
    router
);