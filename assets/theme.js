document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-open]");
  if (opener) {
    const target = document.getElementById(opener.dataset.open);
    if (target) target.hidden = false;
    return;
  }

  const closer = event.target.closest("[data-close]");
  if (closer) {
    const target = document.getElementById(closer.dataset.close);
    if (target) target.hidden = true;
    return;
  }

  const accordion = event.target.closest(".accordion__btn");
  if (accordion) {
    const body = accordion.nextElementSibling;
    if (body) body.hidden = !body.hidden;
    return;
  }

  const thumb = event.target.closest("[data-thumb]");
  if (thumb) {
    const gallery = thumb.closest("[data-gallery]");
    const main = gallery.querySelector("[data-gallery-main]");
    main.src = thumb.dataset.thumb;
    gallery.querySelectorAll("[data-thumb]").forEach((b) => b.setAttribute("aria-current", String(b === thumb)));
  }
});

/* Product variant picking */
document.querySelectorAll("[data-product-form]").forEach((form) => {
  const variants = JSON.parse(form.querySelector("[data-variants]").textContent);
  const idInput = form.querySelector("[data-variant-id]");
  const priceEl = form.querySelector("[data-price]");
  const compareEl = form.querySelector("[data-compare-price]");
  const submit = form.querySelector("[data-submit]");
  const moneyFormat = form.dataset.moneyFormat || "{{amount}}";

  const formatMoney = (cents) =>
    moneyFormat.replace(/\{\{\s*amount\s*\}\}/, (cents / 100).toFixed(2));

  const selected = () =>
    Array.from(form.querySelectorAll("[data-option-index]")).map(
      (group) => group.querySelector('[aria-pressed="true"]')?.dataset.value ?? null,
    );

  const update = () => {
    const chosen = selected();
    const match = variants.find((variant) =>
      chosen.every((value, index) => value === null || variant.options[index] === value),
    );

    if (!match) {
      submit.disabled = true;
      submit.textContent = window.themeStrings?.unavailable || "Unavailable";
      return;
    }

    idInput.value = match.id;
    priceEl.textContent = formatMoney(match.price);
    if (compareEl) {
      const show = match.compare_at_price && match.compare_at_price > match.price;
      compareEl.hidden = !show;
      if (show) compareEl.textContent = formatMoney(match.compare_at_price);
    }
    submit.disabled = !match.available;
    submit.textContent = match.available
      ? window.themeStrings?.addToCart || "Add to cart"
      : window.themeStrings?.soldOut || "Sold out";
  };

  form.querySelectorAll("[data-option-index] .swatch").forEach((button) => {
    button.addEventListener("click", () => {
      button
        .closest("[data-option-index]")
        .querySelectorAll(".swatch")
        .forEach((sibling) => sibling.setAttribute("aria-pressed", String(sibling === button)));
      const head = button.closest(".option").querySelector("[data-option-value]");
      if (head) head.textContent = button.dataset.value;
      update();
    });
  });

  form.querySelectorAll("[data-qty]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = form.querySelector("[name='quantity']");
      const next = Math.max(1, parseInt(input.value, 10) + parseInt(button.dataset.qty, 10));
      input.value = next;
    });
  });

  update();
});

/* Sorting / filtering on collection pages */
document.querySelectorAll("[data-url-select]").forEach((select) => {
  select.addEventListener("change", () => {
    window.location.href = select.value;
  });
});

/* Category fan carousel */
document.querySelectorAll("[data-fan]").forEach((root) => {
  const cards = Array.from(root.querySelectorAll("[data-fan-card]"));
  const dots = Array.from(root.querySelectorAll("[data-fan-dot]"));
  const nameEl = root.querySelector("[data-fan-name]");
  const labels = cards.map((card) => card.querySelector(".fan__label strong")?.textContent.trim() ?? "");
  const offsets = [
    { x: 0, y: 0, r: 0, s: 1, z: 10 },
    { x: 8.25, y: 1.3, r: 7, s: 0.9346, z: 3 },
    { x: 16.5, y: 4, r: 14, s: 0.8498, z: 2 },
    { x: 22.5, y: 7.3, r: 21, s: 0.7756, z: 1 },
  ];
  const total = cards.length;
  if (!total) return;
  let active = 0;

  const render = () => {
    cards.forEach((card, index) => {
      let d = index - active;
      if (d > total / 2) d -= total;
      if (d < -total / 2) d += total;
      const abs = Math.abs(d);
      const hidden = abs >= offsets.length;
      const o = offsets[Math.min(abs, offsets.length - 1)];
      const sign = Math.sign(d);
      card.style.transform =
        "translate(" + o.x * sign + "rem, " + o.y + "rem) rotate(" + o.r * sign + "deg) scale(" + (hidden ? 0.3 : o.s) + ")";
      card.style.zIndex = hidden ? 0 : o.z;
      card.style.opacity = hidden ? 0 : 1;
      card.style.pointerEvents = hidden ? "none" : "auto";
      const link = card.querySelector(".fan__link");
      if (link) link.tabIndex = index === active ? 0 : -1;
    });
    dots.forEach((dot, index) => dot.setAttribute("aria-current", String(index === active)));
    if (nameEl) nameEl.textContent = labels[active];
  };

  const go = (dir) => {
    active = (active + dir + total) % total;
    render();
  };

  root.querySelector("[data-fan-prev]")?.addEventListener("click", () => go(-1));
  root.querySelector("[data-fan-next]")?.addEventListener("click", () => go(1));
  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => {
      active = index;
      render();
    }),
  );
  cards.forEach((card, index) =>
    card.addEventListener("click", (event) => {
      if (index !== active) {
        event.preventDefault();
        active = index;
        render();
      }
    }),
  );

  render();
});
