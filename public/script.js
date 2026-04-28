(() => {
  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const yearEl = document.querySelector("[data-year]");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (navToggle && mobileNav) {
    const closeMenu = () => {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Menüyü aç");
      mobileNav.hidden = true;
    };
    const openMenu = () => {
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Menüyü kapat");
      mobileNav.hidden = false;
    };

    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });

    mobileNav.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement) {
        closeMenu();
      }
    });

    const mq = window.matchMedia("(min-width: 961px)");
    const onChange = (e) => {
      if (e.matches) closeMenu();
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
    } else if (mq.addListener) {
      mq.addListener(onChange);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  const reveal = (entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    }
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(reveal, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    });
    document
      .querySelectorAll(".section-head, .service-card, .feature, .price-card, .faq-list details")
      .forEach((el) => io.observe(el));
  }
})();
