"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  calculateTotals,
  FREE_DELIVERY_AT,
  UNIT_PRICE_CENTS,
} from "../lib/pricing";

type Product = {
  id: string;
  name: string;
  tone: string;
  description: string;
  image: string;
};

type Cart = Record<string, number>;

const products: Product[] = [
  {
    id: "nocturne",
    name: "Black Silver",
    tone: "Black / Silver",
    description: "Bold black acetate with polished silver hardware.",
    image: "/products/nocturne-black.jpeg",
  },
  {
    id: "lucent",
    name: "Crystal Gold",
    tone: "Clear / Gold",
    description: "A crisp transparent frame with warm gold hardware.",
    image: "/products/lucent-clear.jpeg",
  },
  {
    id: "smoke-arc",
    name: "Crystal Silver",
    tone: "Clear / Silver",
    description: "Transparent acetate finished with cool silver details.",
    image: "/products/smoke-arc.jpeg",
  },
  {
    id: "umber",
    name: "Black Gold",
    tone: "Black / Gold",
    description: "Gloss black acetate with rich gold-tone hardware.",
    image: "/products/umber-line.jpeg",
  },
];

const price = UNIT_PRICE_CENTS / 100;
const freeDeliveryAt = FREE_DELIVERY_AT;

export function Storefront() {
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [bagNotice, setBagNotice] = useState("");

  const itemCount = useMemo(
    () => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0),
    [cart],
  );
  const totals = calculateTotals(itemCount);
  const subtotal = totals.subtotalCents / 100;
  const delivery = totals.deliveryCents / 100;
  const total = totals.totalCents / 100;
  const remaining = Math.max(0, freeDeliveryAt - itemCount);

  function add(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setBagNotice(`${products.find((product) => product.id === id)?.name ?? "Frame"} added to your bag.`);
  }

  function change(id: string, delta: number) {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] ?? 0) + delta);
      const next = { ...current };
      if (!quantity) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      city: String(form.get("city") ?? ""),
      address: String(form.get("address") ?? ""),
      notes: String(form.get("notes") ?? ""),
      items: Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
    };
    const phoneDigits = payload.phone.replace(/[\s-]/g, "");
    const lebaneseMobile = /^(?:\+961|00961|0)?(?:3|70|71|76|78|79|81)\d{6}$/;
    if (payload.customerName.trim().length < 2 || !lebaneseMobile.test(phoneDigits) || payload.city.trim().length < 2 || payload.address.trim().length < 8) {
      setError("Please add your name, a valid Lebanese mobile number, area, and full delivery address.");
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        orderNumber?: string;
        error?: string;
      };
      if (!response.ok || !result.orderNumber) {
        throw new Error(result.error ?? "Order could not be placed.");
      }
      setOrderNumber(result.orderNumber);
      setCart({});
    } catch (caught) {
      setError(
        caught instanceof DOMException && caught.name === "AbortError"
          ? "This is taking longer than expected. Please try again or call 79 127 268."
          : caught instanceof Error ? caught.message : "Order could not be placed.",
      );
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  return (
    <main>
      <div className="grain" aria-hidden="true" />
      <div className="announcement">
        <span>Cash on delivery across Lebanon</span>
        <span className="announcement-rule" />
        <span>Free delivery on 3+ pairs</span>
      </div>

      <header className="nav">
        <a className="brand" href="#top" aria-label="Chrome Leb home">
          CHROME LEB
        </a>
        <nav className={menuOpen ? "nav-links is-open" : "nav-links"}>
          <a href="#collection" onClick={() => setMenuOpen(false)}>
            Collection
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            Our approach
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
          </a>
        </nav>
        <div className="nav-actions">
          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open bag with ${itemCount} items`}
          >
            Bag <span>{String(itemCount).padStart(2, "0")}</span>
          </button>
          <button
            className="menu-button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Independent retailer / Lebanon</p>
          <h1>
            Frames without
            <br />
            <em>the markup.</em>
          </h1>
          <p className="hero-note">
            Blue-light-filtering, fashion-first frames for everyday wear. One honest price,
            delivered to your door.
          </p>
          <p className="hero-offer">BUY 3 · GET FREE DELIVERY</p>
          <a className="primary-cta" href="#collection">
            Explore the collection
            <span aria-hidden="true">↘</span>
          </a>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <img
            src="/products/nocturne-black.jpeg"
            alt="Black rectangular eyeglasses"
          />
        </div>
        <div className="hero-foot">
          <span>Designed independently</span>
          <span>Clear lenses · Ready to wear</span>
          <span>Scroll to discover ↓</span>
        </div>
      </section>

      <section className="marlon section-shell">
        <div className="marlon-image"><img src="/marlon.png" alt="Marlon wearing Chrome Leb glasses" /></div>
        <div><p className="eyebrow">Worn by Marlon</p><h2>Stream-ready.<br />Blue-light ready.</h2><p>Marlon wears Chrome Leb for a sharp look on camera, with blue-light-filtering lenses for long screen days.</p><a className="text-link" href="#collection">Shop Marlon’s look <span>→</span></a></div>
      </section>

      <section className="promise">
        <p>One price.</p>
        <p>Four moods.</p>
        <p>No compromise.</p>
      </section>

      <section className="collection section-shell" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The first edition</p>
            <h2>Choose your angle.</h2>
          </div>
          <p>
            Built around expressive proportions and wearable color. Every frame
            arrives ready for cash-on-delivery payment.
          </p>
        </div>
        <div className="product-grid">
          {products.map((product, index) => (
            <article className="product-card" key={product.id}>
              <div className="product-media">
                <span className="product-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <img src={product.image} alt={`${product.name} eyeglasses`} />
                <button
                  className="quick-add"
                  onClick={() => add(product.id)}
                  aria-label={`Add ${product.name} to bag`}
                >
                  Add to bag
                </button>
              </div>
              <div className="product-info">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.tone}</p>
                </div>
                <div className="product-price"><s>$25</s><strong>${price}</strong></div>
              </div>
              <p className="product-description">{product.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bundle section-shell">
        <div className="bundle-art" aria-hidden="true">
          <img src="/products/lucent-clear.jpeg" alt="" />
          <img src="/products/smoke-arc.jpeg" alt="" />
          <img src="/products/umber-line.jpeg" alt="" />
        </div>
        <div className="bundle-copy">
          <p className="eyebrow">The three-frame rule</p>
          <h2>Three frames.<br />$48 delivered.</h2>
          <p>
            Choose any three pairs and we cover the $5 delivery fee. Three looks, one $48 order, nothing extra at checkout.
          </p>
          <button className="text-link" onClick={() => { setCart({ nocturne: 1, lucent: 1, "smoke-arc": 1 }); setBagNotice("Your three-frame trio is in the bag. Delivery is free."); }}>Add the trio to bag <span>→</span></button>
        </div>
      </section>

      <section className="story section-shell" id="story">
        <p className="story-kicker">Independently sourced</p>
        <p className="story-statement">
          We make bold eyewear for people who care about the silhouette—not the
          label.
        </p>
        <div className="story-details">
          <p>
            Every Chrome Leb frame is selected for balance, finish, and daily
            comfort. We keep the collection tight and the price direct.
          </p>
          <p>
            Chrome Leb is an independent retailer and is not affiliated with,
            sponsored by, or an official store of the product manufacturer.
          </p>
        </div>
      </section>

      <section className="facts section-shell">
        <div><strong>$16</strong><span>Every frame</span></div>
        <div><strong>$5</strong><span>Standard delivery</span></div>
        <div><strong>3+</strong><span>Free delivery</span></div>
        <div><strong>COD</strong><span>Pay at your door</span></div>
      </section>

      <section className="faq section-shell" id="faq">
        <div>
          <p className="eyebrow">Need to know</p>
          <h2>Good questions.</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>How does cash on delivery work?<span>+</span></summary>
            <p>Place your order online and pay the courier in cash when it arrives.</p>
          </details>
          <details>
            <summary>When is delivery free?<span>+</span></summary>
            <p>Add any three or more pairs. The $5 fee is removed automatically.</p>
          </details>
          <details>
            <summary>Is Chrome Leb an official manufacturer store?<span>+</span></summary>
            <p>The products are independently sourced and sold by Chrome Leb. Chrome Leb is not an official manufacturer store.</p>
          </details>
          <details>
            <summary>Can I add prescription lenses?<span>+</span></summary>
            <p>The frames arrive with clear demo lenses. Ask your local optician about fitting your prescription.</p>
          </details>
          <details><summary>Need help with an order?<span>+</span></summary><p>Call or WhatsApp the owner at <a href="tel:+96179127268">79 127 268</a>.</p></details>
        </div>
      </section>

      <footer>
        <div className="footer-brand">CHROME LEB</div>
        <div className="footer-grid">
          <div><span>Shop</span><a href="#collection">Collection</a><a href="#faq">Delivery</a></div>
          <div><span>Contact</span><a href="mailto:hello@vantaire.shop">Email</a><a href="#top">Instagram</a></div>
          <div><span>Information</span><a href="#story">About</a><a href="#faq">FAQ</a></div>
          <p>© 2026 Chrome Leb<br />Independent eyewear retailer, Lebanon.</p>
        </div>
      </footer>

      <button className="mobile-shop" onClick={() => setCartOpen(true)}>
        Bag ({itemCount}) <span>${total}</span>
      </button>

      {bagNotice && <div className="bag-notice" role="status">{bagNotice}<button onClick={() => { setBagNotice(""); setCartOpen(true); }}>View bag</button></div>}
      <div
        className={cartOpen ? "overlay is-open" : "overlay"}
        onClick={() => setCartOpen(false)}
      />
      <aside className={cartOpen ? "cart-panel is-open" : "cart-panel"} aria-hidden={!cartOpen}>
        <div className="panel-head">
          <div><p className="eyebrow">Your selection</p><h2>Bag <span>({itemCount})</span></h2></div>
          <button onClick={() => setCartOpen(false)} aria-label="Close bag">×</button>
        </div>

        {!itemCount ? (
          <div className="empty-state">
            <p>Your bag is waiting.</p>
            <button onClick={() => setCartOpen(false)}>Explore frames</button>
          </div>
        ) : (
          <>
            <div className="delivery-progress">
              <div className="progress-track"><span style={{ width: `${Math.min(100, itemCount / freeDeliveryAt * 100)}%` }} /></div>
              <p>{remaining ? `Add ${remaining} more ${remaining === 1 ? "pair" : "pairs"} for free delivery.` : "Free delivery unlocked."}</p>
            </div>
            <div className="cart-items">
              {products.filter((p) => cart[p.id]).map((product) => (
                <div className="cart-item" key={product.id}>
                  <img src={product.image} alt="" />
                  <div><h3>{product.name}</h3><p>{product.tone}</p><strong>${price}</strong></div>
                  <div className="stepper">
                    <button onClick={() => change(product.id, -1)} aria-label={`Remove one ${product.name}`}>−</button>
                    <span>{cart[product.id]}</span>
                    <button onClick={() => change(product.id, 1)} aria-label={`Add one ${product.name}`}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-totals">
              <p><span>Subtotal</span><span>${subtotal}</span></p>
              <p><span>Delivery</span><span>{delivery ? `$${delivery}` : "Free"}</span></p>
              <p className="total"><span>Total</span><span>${total}</span></p>
            </div>
            <button className="checkout-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
              Continue to checkout <span>→</span>
            </button>
          </>
        )}
      </aside>

      <div className={checkoutOpen ? "checkout-modal is-open" : "checkout-modal"}>
        <button className="checkout-backdrop" aria-label="Close checkout" onClick={() => setCheckoutOpen(false)} />
        <section className="checkout-card" aria-modal="true" role="dialog" aria-labelledby="checkout-title">
          <button className="close-checkout" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button>
          {orderNumber ? (
            <div className="success">
              <span>✓</span>
              <p className="eyebrow">Order confirmed</p>
              <h2>We’ll see you at the door.</h2>
              <p>Your order number is <strong>{orderNumber}</strong>. Keep it for reference. Payment is cash on delivery.</p>
              <button onClick={() => { setCheckoutOpen(false); setOrderNumber(""); }}>Continue shopping</button>
            </div>
          ) : (
            <>
              <div className="checkout-title">
                <p className="eyebrow">Secure checkout</p>
                <h2 id="checkout-title">Delivery details</h2>
                <span>Cash on delivery</span>
              </div>
              <form onSubmit={submitOrder} noValidate>
                <fieldset className="delivery-details">
                  <legend>Delivery details</legend>
                  <label>Full name<input name="name" required minLength={2} autoComplete="name" /></label>
                  <label>Lebanese mobile number<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="03 123 456" pattern="(?:\\+961|00961|0)?(?:3|70|71|76|78|79|81)[0-9]{6}" /></label>
                  <a className="checkout-help" href="tel:+96179127268">Need help? 79 127 268</a>
                <label>City / area<input name="city" required minLength={2} autoComplete="address-level2" /></label>
                <label>Full delivery address<textarea name="address" required minLength={8} rows={3} autoComplete="street-address" /></label>
                <label>Delivery notes <small>Optional</small><input name="notes" placeholder="Building, landmark, best time…" /></label>
                </fieldset>
                <div className="checkout-summary">
                  <p><span>{itemCount} {itemCount === 1 ? "pair" : "pairs"}</span><span>${subtotal}</span></p>
                  <p><span>Delivery</span><span>{delivery ? `$${delivery}` : "Free"}</span></p>
                  <p><strong>Total due at door</strong><strong>${total}</strong></p>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="checkout-button" disabled={submitting} aria-busy={submitting}>
                  {submitting ? "Placing order…" : `Place order · $${total}`}
                </button>
                <p className="checkout-note">No card needed. You’ll pay the courier in cash.</p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
