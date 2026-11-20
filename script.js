(() => {
  const cfg = window.NN_CONFIG || {};
  const products = Array.isArray(cfg.products) ? cfg.products : [];
  const currency = cfg.currency || "R";
  const whatsappNumber = String(cfg.whatsappNumber || "27834235145").replace(/\D/g, "");
  const cart = new Map();

  const grid = document.getElementById("productGrid");
  const cartCountEl = document.getElementById("cartCount");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("whatsappCheckout");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const openCartBtn = document.getElementById("openCart");
  const closeCartBtn = document.getElementById("closeCart");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const deliveryCopy = document.getElementById("deliveryCopy");
  const collectionCopy = document.getElementById("collectionCopy");
  const contactWhatsappLink = document.getElementById("contactWhatsappLink");
  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
  if (deliveryCopy && cfg.deliveryInfo) {
    deliveryCopy.textContent = cfg.deliveryInfo;
  }
  if (collectionCopy && cfg.collectionInfo) {
    collectionCopy.textContent = cfg.collectionInfo;
  }
  if (contactWhatsappLink) {
    const greeting = encodeURIComponent("Hello Nourish & Nibble by Yin! I would like to ask about Happy Gut Bites.");
    contactWhatsappLink.href = `https://wa.me/${whatsappNumber}?text=${greeting}`;
  }

  function safe(val) {
    return String(val ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function formatMoney(amount) {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      return "Price on request";
    }
    return `${currency}${amount.toFixed(2)}`;
  }

  function renderProducts() {
    if (!grid) return;
    grid.innerHTML = products
      .map((p) => `
        <article class="product-card">
          <div class="product-img-wrap">
            <img src="${safe(p.image)}" alt="${safe(p.alt || p.name)}">
          </div>
          <div class="product-body">
            <h3>${safe(p.name)}</h3>
            <div class="product-top">
              <span class="pack-badge">${safe(p.packSize)}</span>
              <span class="product-price">${safe(formatMoney(p.price))}</span>
            </div>
            <p class="product-desc">${safe(p.description)}</p>
            <div class="product-ingredients">
              <strong>Ingredients:</strong> ${safe(p.ingredients)}
            </div>
            <div class="product-action">
              <button class="btn btn-primary btn-block" type="button" data-add="${safe(p.id)}">Add to Basket</button>
            </div>
          </div>
        </article>
      `)
      .join("");
  }

  function getTotal() {
    let sum = 0;
    for (const [id, qty] of cart.entries()) {
      const p = products.find((item) => item.id === id);
      if (p && typeof p.price === "number" && qty > 0) {
        sum += p.price * qty;
      }
    }
    return sum;
  }

  function renderCart() {
    const entries = [...cart.entries()].filter(([, qty]) => qty > 0);
    const totalCount = entries.reduce((acc, [, qty]) => acc + qty, 0);

    if (cartCountEl) {
      cartCountEl.textContent = String(totalCount);
    }
    if (cartTotalEl) {
      cartTotalEl.textContent = formatMoney(getTotal());
    }
    if (checkoutBtn) {
      checkoutBtn.disabled = entries.length === 0;
    }
    if (!cartItemsEl) return;

    if (entries.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Your basket is currently empty.</p>';
      return;
    }

    cartItemsEl.innerHTML = entries
      .map(([id, qty]) => {
        const p = products.find((item) => item.id === id);
        if (!p) return "";
        const lineText = typeof p.price === "number" ? formatMoney(p.price * qty) : "Price on request";
        return `
          <div class="cart-item">
            <div class="cart-item-title">${safe(p.name)} (${safe(p.packSize)})</div>
            <div class="cart-item-sub">${safe(formatMoney(p.price))} each &bull; Subtotal: ${safe(lineText)}</div>
            <div class="qty-row">
              <button class="qty-btn" type="button" aria-label="Decrease quantity" data-change="${safe(id)}" data-delta="-1">&minus;</button>
              <span>${qty}</span>
              <button class="qty-btn" type="button" aria-label="Increase quantity" data-change="${safe(id)}" data-delta="1">+</button>
              <button class="remove-btn" type="button" data-remove="${safe(id)}">Remove</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function openCart() {
    if (!cartDrawer || !cartBackdrop) return;
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    cartBackdrop.hidden = false;
  }

  function closeCart() {
    if (!cartDrawer || !cartBackdrop) return;
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartBackdrop.hidden = true;
  }

  function buildWhatsAppMessage() {
    const entries = [...cart.entries()].filter(([, qty]) => qty > 0);
    const lines = [
      `Hello Nourish & Nibble (${cfg.founderBranding || "by Yin"}), I would like to place an order:`,
      ""
    ];
    for (const [id, qty] of entries) {
      const p = products.find((item) => item.id === id);
      if (!p) continue;
      const itemPrice = typeof p.price === "number" ? formatMoney(p.price * qty) : "Price on request";
      lines.push(`- ${p.name} (${p.packSize}) x${qty} — ${itemPrice}`);
    }
    lines.push("");
    lines.push(`Estimated Total: ${formatMoney(getTotal())}`);
    lines.push("Delivery or Collection: ");
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      const id = btn.getAttribute("data-add");
      cart.set(id, (cart.get(id) || 0) + 1);
      renderCart();
      openCart();
    });
  }

  if (cartItemsEl) {
    cartItemsEl.addEventListener("click", (e) => {
      const qtyBtn = e.target.closest("[data-change]");
      if (qtyBtn) {
        const id = qtyBtn.getAttribute("data-change");
        const delta = Number(qtyBtn.getAttribute("data-delta") || 0);
        const nextQty = (cart.get(id) || 0) + delta;
        if (nextQty <= 0) {
          cart.delete(id);
        } else {
          cart.set(id, nextQty);
        }
        renderCart();
        return;
      }

      const removeBtn = e.target.closest("[data-remove]");
      if (removeBtn) {
        const id = removeBtn.getAttribute("data-remove");
        cart.delete(id);
        renderCart();
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const entries = [...cart.entries()].filter(([, qty]) => qty > 0);
      if (!entries.length) return;
      window.open(buildWhatsAppMessage(), "_blank", "noopener,noreferrer");
    });
  }

  if (openCartBtn) openCartBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  renderProducts();
  renderCart();
})();
