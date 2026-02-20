(() => {
  const body = document.body;
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const state = {
    activeTrap: null,
    previousFocus: null,
    observers: []
  };

  function q(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function qa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }

  function lockScroll(reason) {
    if (reason === 'nav') {
      body.classList.add('nav-open');
    }
    if (reason === 'modal') {
      body.classList.add('modal-open');
    }
  }

  function unlockScroll(reason) {
    if (reason === 'nav') {
      body.classList.remove('nav-open');
    }
    if (reason === 'modal') {
      body.classList.remove('modal-open');
    }
  }

  function getFocusable(container) {
    return qa(focusableSelector, container).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function activateFocusTrap(container) {
    if (!container) return;
    state.activeTrap = container;
    state.previousFocus = document.activeElement;
    const nodes = getFocusable(container);
    if (nodes.length) nodes[0].focus();
  }

  function deactivateFocusTrap() {
    const previous = state.previousFocus;
    state.activeTrap = null;
    state.previousFocus = null;
    if (previous && typeof previous.focus === 'function') {
      previous.focus();
    }
  }

  function trapTabNavigation(event) {
    if (!state.activeTrap || event.key !== 'Tab') return;
    const nodes = getFocusable(state.activeTrap);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setupLanguageSwitcher(scope = document) {
    qa('.lang-switcher', scope).forEach(switcher => {
      const toggle = q('.lang-toggle', switcher);
      const menu = q('.lang-menu', switcher);
      if (!toggle || !menu) return;

      toggle.addEventListener('click', () => {
        const open = switcher.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      qa('a', menu).forEach(link => {
        link.addEventListener('click', () => {
          switcher.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    });

    document.addEventListener('click', event => {
      qa('.lang-switcher.open').forEach(openNode => {
        if (!openNode.contains(event.target)) {
          openNode.classList.remove('open');
          const toggle = q('.lang-toggle', openNode);
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function setupDrawer() {
    const burger = q('.burger');
    const drawer = q('.mobile-drawer');
    const overlay = q('.drawer-overlay');
    const closeBtn = q('.drawer-close');

    if (!burger || !drawer || !overlay || !closeBtn) return;

    const openDrawer = () => {
      drawer.classList.add('open');
      overlay.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      lockScroll('nav');
      activateFocusTrap(drawer);
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      unlockScroll('nav');
      deactivateFocusTrap();
    };

    burger.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    qa('a', drawer).forEach(anchor => {
      anchor.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  function setupFaq() {
    const faqItems = qa('.faq-item');
    if (!faqItems.length) return;

    function closeAll(except) {
      faqItems.forEach(item => {
        if (item !== except) {
          item.classList.remove('open');
          const btn = q('.faq-question', item);
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    faqItems.forEach(item => {
      const btn = q('.faq-question', item);
      if (!btn) return;

      btn.addEventListener('click', () => {
        const open = item.classList.contains('open');
        closeAll(item);
        item.classList.toggle('open', !open);
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  }

  function setupModal() {
    const openBtn = q('[data-open-privacy]');
    const modal = q('.modal');
    const overlay = q('.modal-overlay');
    const closeIcon = q('.modal-close-icon');
    const closeBtn = q('.modal-close-btn');

    if (!openBtn || !modal || !overlay || !closeIcon || !closeBtn) return;

    const openModal = () => {
      modal.classList.add('open');
      overlay.classList.add('open');
      openBtn.setAttribute('aria-expanded', 'true');
      lockScroll('modal');
      activateFocusTrap(modal);
    };

    const closeModal = () => {
      modal.classList.remove('open');
      overlay.classList.remove('open');
      openBtn.setAttribute('aria-expanded', 'false');
      unlockScroll('modal');
      deactivateFocusTrap();
    };

    openBtn.addEventListener('click', event => {
      event.preventDefault();
      openModal();
    });

    closeIcon.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  function setupReveals() {
    const revealNodes = qa('.reveal');
    if (!revealNodes.length) return;

    if (!('IntersectionObserver' in window)) {
      revealNodes.forEach(node => node.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    revealNodes.forEach(node => observer.observe(node));
    state.observers.push(observer);
  }

  function sanitizePhoneInputs() {
    qa('input[type="tel"]').forEach(input => {
      input.addEventListener('input', () => {
        const cleaned = input.value.replace(/[^\d+\-()\s]/g, '');
        if (cleaned !== input.value) {
          input.value = cleaned;
        }
      });
    });
  }

  function setupFormValidation() {
    qa('.lead-form').forEach(form => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const name = q('input[name="fullName"]', form);
        const email = q('input[name="professionalEmail"]', form);
        const phone = q('input[name="phoneNumber"]', form);

        const errors = [];

        if (!name || !name.value.trim() || name.value.trim().length < 3) {
          errors.push(name);
        }

        if (!email || !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
          errors.push(email);
        }

        if (!phone || phone.value.trim().length < 6) {
          errors.push(phone);
        }

        qa('input', form).forEach(input => input.removeAttribute('aria-invalid'));

        if (errors.length) {
          errors.forEach(el => {
            if (el) el.setAttribute('aria-invalid', 'true');
          });
          if (errors[0]) errors[0].focus();
          return;
        }

        form.setAttribute('data-submitted', 'true');
        qa('input', form).forEach(input => input.value = '');
      });
    });
  }

  function normalizeAnchorTargets() {
    qa('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', event => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId.length < 2) return;
        const target = q(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function setupKeyboardHandlers() {
    document.addEventListener('keydown', trapTabNavigation);
  }

  function cleanup() {
    state.observers.forEach(observer => observer.disconnect());
    state.observers = [];
  }

  function boot() {
    setupLanguageSwitcher();
    setupDrawer();
    setupFaq();
    setupModal();
    setupReveals();
    sanitizePhoneInputs();
    setupFormValidation();
    normalizeAnchorTargets();
    setupKeyboardHandlers();
  }

  window.addEventListener('beforeunload', cleanup);
  document.addEventListener('DOMContentLoaded', boot);
})();

// Additional resilience helpers for production-grade UX behavior.
(function enhanceUX() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toggleMotionClass() {
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
  }

  function syncHeaderOffset() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const setOffset = () => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    setOffset();
    window.addEventListener('resize', setOffset);
  }

  function handleExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      if (!link.rel.includes('noopener')) link.rel += ' noopener';
      if (!link.rel.includes('noreferrer')) link.rel += ' noreferrer';
    });
  }

  function liveRegionNotice() {
    const forms = document.querySelectorAll('.lead-form');
    forms.forEach(form => {
      const message = document.createElement('p');
      message.className = 'sr-only';
      message.setAttribute('aria-live', 'polite');
      form.appendChild(message);

      form.addEventListener('submit', () => {
        const submitted = form.getAttribute('data-submitted') === 'true';
        if (submitted) {
          message.textContent = form.dataset.successText || 'Form submitted successfully.';
        }
      });
    });
  }

  function markActiveSection() {
    const links = [...document.querySelectorAll('.main-nav a[href^="#"]')];
    const sections = links
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
          links.forEach(link => {
            if (link.getAttribute('href') === id) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, { threshold: 0.55 });

    sections.forEach(section => observer.observe(section));
  }

  function closeMenusOnResize() {
    let previousMobile = window.innerWidth <= 900;
    const drawer = document.querySelector('.mobile-drawer');
    const overlay = document.querySelector('.drawer-overlay');
    const burger = document.querySelector('.burger');

    window.addEventListener('resize', () => {
      const isMobile = window.innerWidth <= 900;
      if (previousMobile && !isMobile && drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
      previousMobile = isMobile;
    });
  }

  function init() {
    toggleMotionClass();
    syncHeaderOffset();
    handleExternalLinks();
    liveRegionNotice();
    markActiveSection();
    closeMenusOnResize();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
