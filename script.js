/**
 * Wedding Landing Page - Shunsuke & Ayaka
 * Interactive JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ============================================================
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve to allow re-animation if needed
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });

  // ============================================================
  // NAVIGATION - Scroll Effect
  // ============================================================
  const nav = document.getElementById('nav');
  let lastScrollY = 0;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ============================================================
  // MOBILE MENU
  // ============================================================
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu__link');

  const toggleMobileMenu = (show) => {
    if (show) {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  hamburger?.addEventListener('click', () => toggleMobileMenu(true));
  mobileMenuClose?.addEventListener('click', () => toggleMobileMenu(false));

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // ============================================================
  // SMOOTH SCROLL for Navigation Links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================================
  // SCROLL TO TOP BUTTON
  // ============================================================
  const scrollTopBtn = document.getElementById('scroll-top');

  const handleScrollTop = () => {
    if (window.scrollY > 500) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', handleScrollTop, { passive: true });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============================================================
  // COUNTDOWN TIMER (to wedding date)
  // ============================================================
  const weddingDate = new Date('2026-11-22T11:00:00+09:00');

  const updateCountdown = () => {
    const now = new Date();
    const diff = weddingDate - now;

    const cdDays = document.getElementById('cd-days');
    const cdTime = document.getElementById('cd-time');

    if (!cdDays || !cdTime) return;

    if (diff <= 0) {
      cdDays.innerText = '0';
      cdTime.innerText = '00:00:00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => num.toString().padStart(2, '0');

    cdDays.innerText = days;
    cdTime.innerHTML = `
      <div class="time-block">
        <span class="time-num">${hours}</span>
        <span class="time-label">HOURS</span>
      </div>
      <div class="time-block">
        <span class="time-num">${pad(minutes)}</span>
        <span class="time-label">MINUTES</span>
      </div>
      <div class="time-block">
        <span class="time-num">${pad(seconds)}</span>
        <span class="time-label">SECONDS</span>
      </div>
    `;
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ============================================================
  // PARALLAX-LIKE EFFECT on Petals
  // ============================================================
  const petals = document.querySelectorAll('.petal');

  const handlePetalParallax = () => {
    const scrollY = window.scrollY;
    petals.forEach((petal, i) => {
      const speed = 0.05 + (i * 0.02);
      petal.style.transform = `translateY(${scrollY * speed}px)`;
    });
  };

  // Only apply on desktop for performance
  if (window.innerWidth > 768) {
    // Disabled by default to not interfere with CSS animation
    // window.addEventListener('scroll', handlePetalParallax, { passive: true });
  }

  // ============================================================
  // GALLERY LIGHTBOX (simple implementation)
  // ============================================================
  const galleryItems = document.querySelectorAll('.gallery__item');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;

      // Create lightbox overlay
      const lightbox = document.createElement('div');
      lightbox.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: fadeIn 0.3s ease;
        padding: 40px;
      `;

      const lightboxImg = document.createElement('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.style.cssText = `
        max-width: 90%;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: scaleIn 0.3s ease;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 1.5rem;
        color: white;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        line-height: 1;
      `;

      lightbox.appendChild(lightboxImg);
      lightbox.appendChild(closeBtn);
      document.body.appendChild(lightbox);
      document.body.style.overflow = 'hidden';

      const closeLightbox = () => {
        lightbox.style.opacity = '0';
        lightbox.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          document.body.removeChild(lightbox);
          document.body.style.overflow = '';
        }, 300);
      };

      lightbox.addEventListener('click', closeLightbox);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
      }, { once: true });
    });
  });

  // ============================================================
  // ACTIVE NAV LINK HIGHLIGHTING
  // ============================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  const highlightNav = () => {
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.style.color = '';
          link.style.fontWeight = '';
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.color = 'var(--color-brown)';
            link.style.fontWeight = '500';
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

  // ============================================================
  // LAZY LOADING IMAGES
  // ============================================================
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imgObserver.observe(img);
    });
  }

  // ============================================================
  // ALBUM CAROUSEL INTERACTIVITY
  // ============================================================
  const albumMainImg = document.getElementById('album-current-img');
  const albumThumbs = document.querySelectorAll('.album-thumb');
  const albumPrevBtn = document.getElementById('album-prev');
  const albumNextBtn = document.getElementById('album-next');
  let currentAlbumIndex = 0;

  const updateAlbumImage = (index) => {
    if (!albumThumbs.length || !albumMainImg) return;
    if (index < 0) index = albumThumbs.length - 1;
    if (index >= albumThumbs.length) index = 0;
    currentAlbumIndex = index;

    const targetThumb = albumThumbs[currentAlbumIndex];
    const newSrc = targetThumb.getAttribute('data-src');

    albumMainImg.style.opacity = '0';
    albumMainImg.style.transform = 'scale(0.98)';
    setTimeout(() => {
      albumMainImg.src = newSrc;
      albumMainImg.style.opacity = '1';
      albumMainImg.style.transform = 'scale(1)';
    }, 150);

    albumThumbs.forEach((thumb, i) => {
      if (i === currentAlbumIndex) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  };

  albumThumbs.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => updateAlbumImage(idx));
  });

  albumPrevBtn?.addEventListener('click', () => updateAlbumImage(currentAlbumIndex - 1));
  albumNextBtn?.addEventListener('click', () => updateAlbumImage(currentAlbumIndex + 1));

  // Touch Swipe for Album
  let touchStartX = 0;
  let touchEndX = 0;
  const albumMainStage = document.getElementById('album-main-stage');

  albumMainStage?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  albumMainStage?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 40) {
      updateAlbumImage(currentAlbumIndex + 1); // Swipe left -> next
    } else if (touchEndX - touchStartX > 40) {
      updateAlbumImage(currentAlbumIndex - 1); // Swipe right -> prev
    }
  }, { passive: true });

  // ============================================================
  // INITIAL LOAD ANIMATION
  // ============================================================
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.6s ease';

  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });
});
