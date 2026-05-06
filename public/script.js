const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const header = document.querySelector(".site-header");
const topProgress = document.getElementById("topProgress");
const carouselViewport = document.querySelector(".carousel-viewport");
const carouselTrack = document.getElementById("carouselTrack");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const carouselDots = document.getElementById("carouselDots");
const carouselThumbs = document.getElementById("carouselThumbs");
const carouselThumbButtons = carouselThumbs
  ? Array.from(carouselThumbs.querySelectorAll(".carousel-thumb"))
  : [];

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

window.addEventListener("scroll", () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

  if (topProgress) {
    topProgress.style.width = `${percent}%`;
  }

  if (!header) {
    return;
  }

  if (window.scrollY > 8) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

const revealEls = document.querySelectorAll(".reveal");
const observer = typeof IntersectionObserver !== "undefined"
  ? new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  )
  : null;

revealEls.forEach((el) => {
  const rect = el.getBoundingClientRect();
  const isInInitialViewport = rect.top < window.innerHeight * 0.98 && rect.bottom > 0;

  if (isInInitialViewport) {
    el.classList.add("in-view");
    return;
  }

  if (observer) {
    observer.observe(el);
  } else {
    el.classList.add("in-view");
  }
});

const textMotionTargets = document.querySelectorAll(
  ".hero-copy .eyebrow, .hero-copy h1, .hero-copy .lead, .hero-showcase-copy h2, .hero-showcase-copy p, .section-head .eyebrow, .section-head h2, .section-note, .strip article h2, .strip article p, .about-panel h3, .about-panel p, .service-card h3, .service-card p, .profile-card p, .status-guide-card h3, .status-guide-card p, .project-spotlight-copy h3, .project-spotlight-copy p, .contact-form label, .contact-card h3, .contact-card p"
);

let motionIndex = 0;

textMotionTargets.forEach((el) => {
  if (el.classList.contains("motion-ready")) {
    return;
  }

  const motionClass = motionIndex % 2 === 0 ? "text-motion-left" : "text-motion-right";
  const motionDelay = Math.min(motionIndex * 45, 420);

  el.classList.add("motion-ready", motionClass);
  el.style.setProperty("--motion-delay", `${motionDelay}ms`);
  motionIndex += 1;
});

const spotlightImage = document.getElementById("spotlightImage");
const spotlightTitle = document.getElementById("spotlightTitle");
const spotlightType = document.getElementById("spotlightType");
const spotlightDescription = document.getElementById("spotlightDescription");
const spotlightPoints = document.getElementById("spotlightPoints");
const residentialSpotlight = document.getElementById("residentialSpotlight");
const spotlightSwapBtn = document.getElementById("spotlightSwapBtn");
const projectCards = Array.from(document.querySelectorAll(".project-card"));

const carouselSlides = carouselTrack ? Array.from(carouselTrack.querySelectorAll(".carousel-slide")) : [];
let carouselIndex = 0;
let carouselThumbAnimationFrame = 0;
let carouselThumbLastTime = 0;
let carouselThumbPauseUntil = 0;
const carouselThumbScrollSpeed = 26;
const carouselThumbPauseDuration = 5000;
let carouselThumbLoopSize = 0;
let carouselThumbVirtualOffset = 0;
let carouselAutoAdvanceTimer = 0;
let carouselAutoAdvancePaused = false;
const carouselAutoAdvanceDelay = 4200;

function isCarouselThumbHorizontal() {
  if (!carouselThumbs) {
    return false;
  }

  return carouselThumbs.scrollWidth - carouselThumbs.clientWidth > 2 && window.matchMedia("(max-width: 940px)").matches;
}

function getCarouselSlideWidth() {
  if (!carouselViewport) {
    return 0;
  }

  return carouselViewport.clientWidth;
}

function setCarouselThumbState() {
  if (!carouselThumbs || carouselThumbButtons.length === 0) {
    return;
  }

  carouselThumbButtons.forEach((button, index) => {
    button.classList.toggle("active", index === carouselIndex);
  });
}

function refreshCarouselThumbLoopMetrics() {
  if (!carouselThumbs) {
    carouselThumbLoopSize = 0;
    carouselThumbVirtualOffset = 0;
    return;
  }

  carouselThumbLoopSize = isCarouselThumbHorizontal()
    ? Math.max(0, carouselThumbs.scrollWidth - carouselThumbs.clientWidth)
    : Math.max(0, carouselThumbs.scrollHeight - carouselThumbs.clientHeight);

  if (carouselThumbLoopSize > 0) {
    const currentOffset = isCarouselThumbHorizontal() ? carouselThumbs.scrollLeft : carouselThumbs.scrollTop;
    carouselThumbVirtualOffset = ((currentOffset % carouselThumbLoopSize) + carouselThumbLoopSize) % carouselThumbLoopSize;
  } else {
    carouselThumbVirtualOffset = 0;
  }
}

function pauseCarouselThumbAutoScroll(duration = carouselThumbPauseDuration) {
  if (!carouselThumbs) {
    return;
  }

  carouselThumbPauseUntil = Math.max(carouselThumbPauseUntil, window.performance.now() + duration);
}

function startCarouselThumbAutoScroll() {
  if (!carouselThumbs || carouselThumbAnimationFrame) {
    return;
  }

  refreshCarouselThumbLoopMetrics();

  const tick = (time) => {
    const horizontal = isCarouselThumbHorizontal();
    const thumbMaxScroll = horizontal
      ? Math.max(0, carouselThumbs.scrollWidth - carouselThumbs.clientWidth)
      : Math.max(0, carouselThumbs.scrollHeight - carouselThumbs.clientHeight);

    if (!carouselThumbLastTime) {
      carouselThumbLastTime = time;
    }

    const elapsed = Math.min(time - carouselThumbLastTime, 34);
    carouselThumbLastTime = time;

    if ((!carouselThumbLoopSize || carouselThumbLoopSize > thumbMaxScroll + 1) && thumbMaxScroll > 0) {
      refreshCarouselThumbLoopMetrics();
    }

    if (time >= carouselThumbPauseUntil && thumbMaxScroll > 0) {
      const step = (carouselThumbScrollSpeed * elapsed) / 1000;
      const loopTarget = carouselThumbLoopSize > 0 ? carouselThumbLoopSize : thumbMaxScroll;
      carouselThumbVirtualOffset += step;

      if (horizontal) {
        if (loopTarget > 0) {
          carouselThumbVirtualOffset %= loopTarget;
        }
        carouselThumbs.scrollLeft = loopTarget > 0 ? carouselThumbVirtualOffset : 0;
      } else {
        if (loopTarget > 0) {
          carouselThumbVirtualOffset %= loopTarget;
        }
        carouselThumbs.scrollTop = loopTarget > 0 ? carouselThumbVirtualOffset : 0;
      }
    }

    carouselThumbAnimationFrame = window.requestAnimationFrame(tick);
  };

  carouselThumbAnimationFrame = window.requestAnimationFrame(tick);
}

function renderCarouselDots() {
  if (!carouselDots) {
    return;
  }

  carouselDots.innerHTML = "";

  carouselSlides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `carousel-dot${index === carouselIndex ? " active" : ""}`;
    dot.setAttribute("aria-label", `Go to showcase slide ${index + 1}`);
    dot.addEventListener("click", () => {
      goToCarouselSlide(index);
    });
    carouselDots.append(dot);
  });
}

function syncCarouselState() {
  if (!carouselViewport || carouselSlides.length === 0) {
    return;
  }

  const slideWidth = getCarouselSlideWidth();
  if (slideWidth > 0) {
    carouselIndex = Math.max(0, Math.min(Math.round(carouselViewport.scrollLeft / slideWidth), carouselSlides.length - 1));
  }

  if (carouselPrev) {
    carouselPrev.disabled = carouselIndex === 0;
  }

  if (carouselNext) {
    carouselNext.disabled = carouselIndex === carouselSlides.length - 1;
  }

  renderCarouselDots();
  setCarouselThumbState();
}

function stopCarouselAutoAdvance() {
  if (!carouselAutoAdvanceTimer) {
    return;
  }

  window.clearInterval(carouselAutoAdvanceTimer);
  carouselAutoAdvanceTimer = 0;
}

function startCarouselAutoAdvance() {
  if (!carouselViewport || carouselSlides.length < 2 || carouselAutoAdvancePaused || carouselAutoAdvanceTimer) {
    return;
  }

  carouselAutoAdvanceTimer = window.setInterval(() => {
    const nextIndex = carouselIndex >= carouselSlides.length - 1 ? 0 : carouselIndex + 1;
    goToCarouselSlide(nextIndex);
  }, carouselAutoAdvanceDelay);
}

function pauseCarouselAutoAdvance() {
  carouselAutoAdvancePaused = true;
  stopCarouselAutoAdvance();
}

function resumeCarouselAutoAdvance() {
  carouselAutoAdvancePaused = false;
  startCarouselAutoAdvance();
}

function restartCarouselAutoAdvance() {
  stopCarouselAutoAdvance();
  startCarouselAutoAdvance();
}

function goToCarouselSlide(index) {
  if (!carouselViewport || carouselSlides.length === 0) {
    return;
  }

  carouselIndex = Math.max(0, Math.min(index, carouselSlides.length - 1));
  carouselViewport.scrollTo({
    left: carouselIndex * getCarouselSlideWidth(),
    behavior: "smooth",
  });
  window.requestAnimationFrame(syncCarouselState);
  restartCarouselAutoAdvance();
}

if (carouselPrev) {
  carouselPrev.addEventListener("click", () => {
    goToCarouselSlide(carouselIndex - 1);
    pauseCarouselThumbAutoScroll();
  });
}

if (carouselNext) {
  carouselNext.addEventListener("click", () => {
    goToCarouselSlide(carouselIndex + 1);
    pauseCarouselThumbAutoScroll();
  });
}

if (carouselThumbs) {
  carouselThumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      pauseCarouselThumbAutoScroll();
      const index = Number(button.dataset.index || 0);
      goToCarouselSlide(index);
    });
  });

  carouselThumbs.addEventListener("pointerdown", () => {
    pauseCarouselThumbAutoScroll();
    carouselThumbVirtualOffset = isCarouselThumbHorizontal() ? carouselThumbs.scrollLeft : carouselThumbs.scrollTop;
  });

  carouselThumbs.addEventListener("wheel", () => {
    pauseCarouselThumbAutoScroll();
    carouselThumbVirtualOffset = isCarouselThumbHorizontal() ? carouselThumbs.scrollLeft : carouselThumbs.scrollTop;
  }, { passive: true });
}

if (carouselViewport) {
  let carouselScrollFrame = 0;

  carouselViewport.addEventListener("scroll", () => {
    if (carouselScrollFrame) {
      return;
    }

    carouselScrollFrame = window.requestAnimationFrame(() => {
      carouselScrollFrame = 0;
      syncCarouselState();
    });
  });

  carouselViewport.addEventListener("pointerdown", () => {
    pauseCarouselAutoAdvance();
    pauseCarouselThumbAutoScroll();
  });

  carouselViewport.addEventListener("pointerup", () => {
    resumeCarouselAutoAdvance();
  });

  carouselViewport.addEventListener("mouseenter", () => {
    pauseCarouselAutoAdvance();
  });

  carouselViewport.addEventListener("mouseleave", () => {
    resumeCarouselAutoAdvance();
  });

  carouselViewport.addEventListener("focusin", () => {
    pauseCarouselAutoAdvance();
  });

  carouselViewport.addEventListener("focusout", () => {
    resumeCarouselAutoAdvance();
  });
}

window.addEventListener("resize", () => {
  syncCarouselState();
  refreshCarouselThumbLoopMetrics();
  restartCarouselAutoAdvance();
});

syncCarouselState();
startCarouselThumbAutoScroll();
startCarouselAutoAdvance();

// Re-sync carousel after media is fully loaded. On first render, image dimensions can
// settle after script execution, which can delay correct thumb/track behavior.
const carouselMediaImages = Array.from(document.querySelectorAll(".carousel-slide img, .carousel-thumb img"));

function rehydrateCarouselAfterMediaLoad() {
  syncCarouselState();
  refreshCarouselThumbLoopMetrics();
  restartCarouselAutoAdvance();
}

if (carouselMediaImages.length > 0) {
  carouselMediaImages.forEach((image) => {
    if (image.complete) {
      return;
    }

    image.addEventListener("load", rehydrateCarouselAfterMediaLoad, { once: true });
  });
}

window.addEventListener("load", () => {
  rehydrateCarouselAfterMediaLoad();
});

// Project filtering (using event delegation for Next.js navigation compatibility)
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;

  const filterTabs = document.querySelectorAll(".filter-tab");
  const projectCardElements = document.querySelectorAll(".project-card");
  const selectedFilter = tab.dataset.filter;

  filterTabs.forEach((t) => {
    t.classList.remove("active");
    if (t.hasAttribute("aria-pressed")) {
      t.setAttribute("aria-pressed", "false");
    }
  });
  tab.classList.add("active");
  if (tab.hasAttribute("aria-pressed")) {
    tab.setAttribute("aria-pressed", "true");
  }

  projectCardElements.forEach((card) => {
    const cardType = card.dataset.type;
    const isVisible = selectedFilter === "all" || cardType === selectedFilter;
    card.classList.toggle("hidden", !isVisible);
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseCarouselAutoAdvance();
    return;
  }

  resumeCarouselAutoAdvance();
});

// Carousel lightbox functionality
const carouselLightbox = document.getElementById("carouselLightbox");
const carouselLightboxImage = document.getElementById("carouselLightboxImage");
const carouselLightboxCaption = document.getElementById("carouselLightboxCaption");
const carouselLightboxClose = document.querySelector(".carousel-lightbox-close");
const carouselLightboxPrev = document.querySelector(".carousel-lightbox-prev");
const carouselLightboxNext = document.querySelector(".carousel-lightbox-next");
const carouselZoomButtons = document.querySelectorAll(".carousel-zoom-btn");
const carouselSlideImages = Array.from(document.querySelectorAll(".carousel-slide img"));
const projectCardImages = Array.from(document.querySelectorAll(".project-card img"));
const spotlightPreviewImage = document.getElementById("spotlightImage");
const modalTriggerImages = [...carouselSlideImages, ...projectCardImages].filter((image, index, images) => {
  return image && images.indexOf(image) === index;
});

function getLightboxCaptionFromImage(image) {
  if (!image) {
    return "";
  }

  const slideTitle = image.closest(".carousel-slide")?.querySelector(".carousel-caption h3")?.textContent?.trim();
  if (slideTitle) {
    return slideTitle;
  }

  const projectTitle = image.closest(".project-card")?.querySelector("h3")?.textContent?.trim();
  if (projectTitle) {
    return projectTitle;
  }

  if (image.id === "spotlightImage") {
    const spotlightTitleText = document.getElementById("spotlightTitle")?.textContent?.trim();
    if (spotlightTitleText) {
      return spotlightTitleText;
    }
  }

  return image.alt || "Featured project";
}

let lightboxImageIndex = 0;
let lightboxImages = [];
let lightboxScrollPosition = 0;
let lightboxLastTrigger = null;

function syncLightboxImageSources() {
  const sources = [...modalTriggerImages];

  if (spotlightPreviewImage) {
    sources.push(spotlightPreviewImage);
  }

  const uniqueBySrc = [];
  const seenSrc = new Set();

  sources.forEach((img) => {
    if (!img || !img.src || seenSrc.has(img.src)) {
      return;
    }

    seenSrc.add(img.src);
    uniqueBySrc.push({
      src: img.src,
      alt: img.alt,
      caption: getLightboxCaptionFromImage(img),
    });
  });

  lightboxImages = uniqueBySrc;
}

function setLightboxDisplay(source) {
  if (!source || !carouselLightboxImage) {
    return;
  }

  carouselLightboxImage.src = source.src;
  carouselLightboxImage.alt = source.alt || "Enlarged carousel image";

  if (carouselLightboxCaption) {
    const captionText = source.caption || source.alt || "";
    carouselLightboxCaption.textContent = captionText;
    carouselLightboxCaption.hidden = captionText.length === 0;
  }
}

function updateLightboxNavButtons() {
  if (!carouselLightboxPrev || !carouselLightboxNext) {
    return;
  }

  const hasNavigableGallery = lightboxImages.length > 1 && lightboxImageIndex >= 0;
  carouselLightboxPrev.disabled = !hasNavigableGallery || lightboxImageIndex === 0;
  carouselLightboxNext.disabled = !hasNavigableGallery || lightboxImageIndex === lightboxImages.length - 1;
}

function openCarouselLightbox(imageSrc, imageAlt, preferredIndex = -1) {
  if (!carouselLightbox) return;
  if (carouselLightbox.classList.contains("active")) return;
  pauseCarouselAutoAdvance();

  syncLightboxImageSources();

  lightboxScrollPosition = window.scrollY || window.pageYOffset || 0;
  lightboxLastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  lightboxImageIndex = preferredIndex >= 0
    ? preferredIndex
    : lightboxImages.findIndex((img) => img.src === imageSrc);

  if (lightboxImageIndex === -1) {
    setLightboxDisplay({
      src: imageSrc,
      alt: imageAlt,
      caption: imageAlt,
    });
  } else {
    setLightboxDisplay(lightboxImages[lightboxImageIndex]);
  }

  carouselLightbox.classList.add("active");
  carouselLightbox.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("lightbox-active");
  document.body.classList.add("lightbox-active");
  document.body.style.position = "fixed";
  document.body.style.top = `-${lightboxScrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  updateLightboxNavButtons();
}

function closeCarouselLightbox() {
  if (!carouselLightbox) return;
  if (!carouselLightbox.classList.contains("active")) return;

  carouselLightbox.classList.remove("active");
  carouselLightbox.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("lightbox-active");
  document.body.classList.remove("lightbox-active");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  const scrollingElement = document.scrollingElement || document.documentElement;
  const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
  const previousBodyScrollBehavior = document.body.style.scrollBehavior;

  document.documentElement.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";
  scrollingElement.scrollTop = lightboxScrollPosition;
  window.scrollTo(0, lightboxScrollPosition);

  window.requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
    document.body.style.scrollBehavior = previousBodyScrollBehavior;
  });

  if (lightboxLastTrigger && typeof lightboxLastTrigger.focus === "function") {
    lightboxLastTrigger.focus({ preventScroll: true });
  }

  resumeCarouselAutoAdvance();
}

function forceResetLightboxState() {
  if (!carouselLightbox) {
    return;
  }

  carouselLightbox.classList.remove("active");
  carouselLightbox.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("lightbox-active");
  document.body.classList.remove("lightbox-active");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
}

function navigateLightbox(direction) {
  const newIndex = lightboxImageIndex + direction;
  if (newIndex >= 0 && newIndex < lightboxImages.length) {
    lightboxImageIndex = newIndex;
    setLightboxDisplay(lightboxImages[newIndex]);
    updateLightboxNavButtons();
  }
}

if (carouselLightbox) {
  // Close button
  if (carouselLightboxClose) {
    carouselLightboxClose.addEventListener("click", (e) => {
      e.stopPropagation();
      closeCarouselLightbox();
    });
  }

  // Next button
  if (carouselLightboxNext) {
    carouselLightboxNext.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
  }

  // Previous button
  if (carouselLightboxPrev) {
    carouselLightboxPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });
  }

  // Click on overlay to close (anywhere except close button or nav buttons)
  carouselLightbox.addEventListener("click", (e) => {
    if (
      e.target.closest(".carousel-lightbox-media")
      || e.target.closest(".carousel-lightbox-caption")
      || e.target.closest("img")
      || e.target.closest("p")
      || e.target.closest("button")
    ) {
      return;
    }

    if (
      e.target.closest(".carousel-lightbox-close")
      || e.target.closest(".carousel-lightbox-prev")
      || e.target.closest(".carousel-lightbox-next")
    ) {
      return;
    }
    closeCarouselLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!carouselLightbox.classList.contains("active")) return;

    if (e.key === "Escape") {
      closeCarouselLightbox();
    } else if (e.key === "ArrowRight") {
      navigateLightbox(1);
    } else if (e.key === "ArrowLeft") {
      navigateLightbox(-1);
    }
  });

  // Safety net for interrupted transitions or edge navigation states.
  window.addEventListener("pagehide", forceResetLightboxState);
}

// Zoom button click handlers
carouselZoomButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const slide = button.closest(".carousel-slide");
    const image = slide?.querySelector("img");
    if (image) {
      openCarouselLightbox(image.src, image.alt, modalTriggerImages.indexOf(image));
    }
  });
});

// Image click handlers
modalTriggerImages.forEach((image) => {
  image.style.cursor = "pointer";
  image.addEventListener("click", (event) => {
    if (image.closest(".project-card")) {
      event.preventDefault();
      event.stopPropagation();
    }
    openCarouselLightbox(image.src, image.alt, modalTriggerImages.indexOf(image));
  });
});

if (spotlightPreviewImage) {
  spotlightPreviewImage.style.cursor = "pointer";
  spotlightPreviewImage.addEventListener("click", () => {
    openCarouselLightbox(spotlightPreviewImage.src, spotlightPreviewImage.alt);
  });
}

function updateProjectSpotlight(card) {
  if (!card || !spotlightImage || !spotlightTitle || !spotlightType || !spotlightDescription) {
    return;
  }

  const image = card.querySelector("img");
  const title = card.querySelector("h3");
  const tag = card.querySelector(".tag");
  const description = card.dataset.description || "Project details available on request.";

  if (image) {
    spotlightImage.src = image.src;
    spotlightImage.alt = image.alt || "Featured project image";
  }

  if (title) {
    spotlightTitle.textContent = title.textContent;
  }

  if (tag) {
    spotlightType.textContent = tag.textContent;
  }

  spotlightDescription.textContent = description;
}

const residentialSpotlightProjects = [
  {
    image: "assets/images/Aventi Townhomes Facade Entrance.avif",
    alt: "Aventi Townhomes facade entrance",
    title: "Aventi Townhomes",
    type: "Completed / Built",
    description: "Aventi Townhomes is an award-winning Green Architecture development in Quezon City with strong passive ventilation and healthy-living design strategies.",
    points: [
      "Best Housing Development - Philippines Nationwide 2013",
      "Natural ventilation focused planning",
      "Built and on market",
    ],
  },
  {
    image: "assets/images/projects-carousel-02.jpg",
    alt: "Contemporary family residence interior",
    title: "Flexible Family Residence",
    type: "Concept / Rendered",
    description: "A family-oriented home concept with adaptable zones for changing needs over time.",
    points: [
      "Climate-sensitive planning",
      "Cost-aware design decisions",
      "Resilient material strategy",
    ],
  },
];

let residentialSpotlightIndex = 0;
let residentialSpotlightAnimating = false;
const residentialSpotlightSwapOutDuration = 170;
const residentialSpotlightSwapTotalDuration = 380;
const residentialSpotlightLoopDelay = 5200;
let residentialSpotlightLoopTimer = 0;

function renderResidentialSpotlight(index) {
  if (!residentialSpotlight || !spotlightImage || !spotlightTitle || !spotlightType || !spotlightDescription || !spotlightPoints) {
    return;
  }

  const safeIndex = Math.max(0, Math.min(index, residentialSpotlightProjects.length - 1));
  const project = residentialSpotlightProjects[safeIndex];

  spotlightImage.src = project.image;
  spotlightImage.alt = project.alt;
  spotlightTitle.textContent = project.title;
  spotlightType.textContent = project.type;
  spotlightDescription.textContent = project.description;
  spotlightPoints.innerHTML = project.points.map((point) => `<span>${point}</span>`).join("");

  const isImageRight = safeIndex % 2 === 0;
  residentialSpotlight.classList.toggle("is-image-right", isImageRight);
}

function runResidentialSpotlightSwap() {
  if (!residentialSpotlight || !spotlightSwapBtn || residentialSpotlightAnimating) {
    return;
  }

  residentialSpotlightAnimating = true;
  spotlightSwapBtn.disabled = true;
  residentialSpotlight.classList.add("is-swapping");

  window.setTimeout(() => {
    residentialSpotlightIndex = (residentialSpotlightIndex + 1) % residentialSpotlightProjects.length;
    renderResidentialSpotlight(residentialSpotlightIndex);
    window.requestAnimationFrame(() => {
      residentialSpotlight.classList.remove("is-swapping");
    });
  }, residentialSpotlightSwapOutDuration);

  window.setTimeout(() => {
    residentialSpotlightAnimating = false;
    spotlightSwapBtn.disabled = false;
  }, residentialSpotlightSwapTotalDuration);
}

function stopResidentialSpotlightLoop() {
  if (!residentialSpotlightLoopTimer) {
    return;
  }

  window.clearInterval(residentialSpotlightLoopTimer);
  residentialSpotlightLoopTimer = 0;
}

function startResidentialSpotlightLoop() {
  if (!residentialSpotlight || residentialSpotlightProjects.length < 2 || residentialSpotlightLoopTimer) {
    return;
  }

  residentialSpotlightLoopTimer = window.setInterval(() => {
    runResidentialSpotlightSwap();
  }, residentialSpotlightLoopDelay);
}

function restartResidentialSpotlightLoop() {
  stopResidentialSpotlightLoop();
  startResidentialSpotlightLoop();
}

projectCards.forEach((card) => {
  card.addEventListener("mouseenter", () => updateProjectSpotlight(card));
  card.addEventListener("focusin", () => updateProjectSpotlight(card));
});

if (projectCards.length > 0) {
  updateProjectSpotlight(projectCards[0]);
}

if (residentialSpotlight && spotlightSwapBtn) {
  renderResidentialSpotlight(residentialSpotlightIndex);
  startResidentialSpotlightLoop();

  spotlightSwapBtn.addEventListener("click", () => {
    runResidentialSpotlightSwap();
    restartResidentialSpotlightLoop();
  });

  residentialSpotlight.addEventListener("mouseenter", () => {
    stopResidentialSpotlightLoop();
  });

  residentialSpotlight.addEventListener("mouseleave", () => {
    startResidentialSpotlightLoop();
  });

  residentialSpotlight.addEventListener("focusin", () => {
    stopResidentialSpotlightLoop();
  });

  residentialSpotlight.addEventListener("focusout", () => {
    startResidentialSpotlightLoop();
  });
}

const accordionItems = document.querySelectorAll(".accordion-item");

accordionItems.forEach((item) => {
  const trigger = item.querySelector(".accordion-trigger");

  if (!trigger) {
    return;
  }

  trigger.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");

    accordionItems.forEach((target) => {
      target.classList.remove("open");
      const targetTrigger = target.querySelector(".accordion-trigger");
      if (targetTrigger) {
        targetTrigger.setAttribute("aria-expanded", "false");
      }
    });

    if (!isOpen) {
      item.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});

const form = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");
const backToTopLinks = document.querySelectorAll(".back-to-top");

function initializePhilippineAddressFields() {
  if (!form || !formMessage) {
    return null;
  }

  const provinceCityInput = form.querySelector('input[name="provinceCity"]');
  const municipalityCityInput = form.querySelector('input[name="municipalityCity"]');
  const barangayInput = form.querySelector('input[name="barangay"]');
  const postalCodeInput = form.querySelector('input[name="postalCode"]');
  const provinceCityList = document.getElementById("provinceCitySuggestions");
  const municipalityList = document.getElementById("municipalitySuggestions");
  const barangayList = document.getElementById("barangaySuggestions");
  const addressHint = document.getElementById("addressHint");

  if (!provinceCityInput || !municipalityCityInput || !barangayInput || !postalCodeInput || !provinceCityList || !municipalityList || !barangayList || !addressHint) {
    return null;
  }

  const psgcApiBase = "https://psgc.gitlab.io/api";
  const psgcCache = new Map();
  const addressState = {
    lookupReady: false,
    provinceCityEntries: [],
    municipalityMasterEntries: [],
    municipalityEntries: [],
    barangayEntries: [],
    selectedProvinceCity: null,
    selectedLocality: null,
    selectedBarangayParent: null,
  };

  const defaultHint = "Choose a province first. The next fields unlock based on your selection.";

  function normalizeSearchText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ");
  }

  function formatCityName(name) {
    if (name.startsWith("City of ")) {
      return `${name.slice(8)} City`;
    }

    if (name.startsWith("Science City of ")) {
      return `${name.slice(16)} Science City`;
    }

    if (name.startsWith("Island Garden City of ")) {
      return `${name.slice(22)} Island Garden City`;
    }

    return name;
  }

  function toDisplayName(record, kind) {
    if (kind === "city") {
      return formatCityName(record.name);
    }

    return record.name;
  }

  function createEntry(record, kind) {
    const displayName = toDisplayName(record, kind);
    const searchTerms = [record.name, displayName, record.oldName || ""]
      .map(normalizeSearchText)
      .filter(Boolean)
      .join(" ");

    return {
      code: record.code,
      kind,
      name: record.name,
      displayName,
      provinceCode: record.provinceCode || "",
      searchTerms,
    };
  }

  function sortEntries(entries) {
    return entries.sort((left, right) => {
      const leftName = normalizeSearchText(left.displayName);
      const rightName = normalizeSearchText(right.displayName);
      return leftName.localeCompare(rightName, "en", { sensitivity: "base" }) || left.displayName.localeCompare(right.displayName, "en", { sensitivity: "base" });
    });
  }

  function fillDatalist(listElement, entries) {
    listElement.replaceChildren(
      ...entries.map((entry) => {
        const option = document.createElement("option");
        option.value = entry.displayName;
        return option;
      })
    );
  }

  function resolveEntry(entries, value) {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue) {
      return null;
    }

    return entries.find((entry) => {
      const matchesDisplayName = normalizeSearchText(entry.displayName) === normalizedValue;
      const matchesOfficialName = normalizeSearchText(entry.name) === normalizedValue;
      return matchesDisplayName || matchesOfficialName;
    }) || null;
  }

  function filterEntriesByPrefix(entries, value) {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue) {
      return entries;
    }

    return entries.filter((entry) => {
      const displayName = normalizeSearchText(entry.displayName);
      const officialName = normalizeSearchText(entry.name);
      return displayName.startsWith(normalizedValue) || officialName.startsWith(normalizedValue);
    });
  }

  function setFieldValidity(input, isValid, message) {
    if (!addressState.lookupReady) {
      input.setCustomValidity("");
      return;
    }

    input.setCustomValidity(isValid ? "" : message);
  }

  function setAddressHint(text) {
    addressHint.textContent = text;
  }

  function resetBarangayField() {
    barangayInput.value = "";
    barangayInput.disabled = true;
    barangayInput.required = false;
    barangayInput.placeholder = "Choose after municipality/city";
    barangayInput.setCustomValidity("");
    addressState.barangayEntries = [];
    fillDatalist(barangayList, []);
  }

  function resetLocalityField() {
    municipalityCityInput.value = "";
    municipalityCityInput.disabled = true;
    municipalityCityInput.required = false;
    municipalityCityInput.placeholder = "Choose after province";
    municipalityCityInput.setCustomValidity("");
    addressState.municipalityEntries = [];
    fillDatalist(municipalityList, []);
  }

  function clearAddressSelection(preserveProvinceValidity = false) {
    addressState.selectedProvinceCity = null;
    addressState.selectedLocality = null;
    addressState.selectedBarangayParent = null;
    if (!preserveProvinceValidity) {
      provinceCityInput.setCustomValidity("");
    }
    resetLocalityField();
    resetBarangayField();
    setAddressHint(defaultHint);
  }

  async function loadJson(url) {
    if (psgcCache.has(url)) {
      return psgcCache.get(url);
    }

    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }

    const data = await response.json();
    psgcCache.set(url, data);
    return data;
  }

  async function loadFirstWorkingJson(urls) {
    for (const url of urls) {
      try {
        return await loadJson(url);
      } catch {
        // Try the next PSGC endpoint variant.
      }
    }

    return [];
  }

  async function loadAddressData() {
    try {
      const [provincesData, citiesData, municipalitiesData] = await Promise.all([
        loadJson(`${psgcApiBase}/provinces.json`),
        loadJson(`${psgcApiBase}/cities.json`),
        loadJson(`${psgcApiBase}/municipalities.json`),
      ]);

      const provinceEntries = provincesData.map((record) => createEntry(record, "province"));
      const cityEntries = citiesData.map((record) => createEntry(record, "city"));
      const municipalityEntries = municipalitiesData.map((record) => createEntry(record, "municipality"));
      addressState.provinceCityEntries = sortEntries(provinceEntries);
      addressState.municipalityMasterEntries = sortEntries([...municipalityEntries, ...cityEntries]);
      addressState.municipalityEntries = [];
      addressState.lookupReady = true;

      fillDatalist(provinceCityList, addressState.provinceCityEntries);
      fillDatalist(municipalityList, []);
      fillDatalist(barangayList, []);
    } catch {
      addressState.lookupReady = false;
      setAddressHint("Address suggestions are temporarily unavailable. You can still type the address manually.");
    }
  }

  function getLocalityEntriesForProvince(provinceCode) {
    return sortEntries(addressState.municipalityMasterEntries.filter((entry) => entry.provinceCode === provinceCode));
  }

  async function loadBarangaysForParent(parentEntry) {
    addressState.selectedBarangayParent = parentEntry;

    const endpoints = parentEntry.kind === "city"
      ? [
        `${psgcApiBase}/cities/${parentEntry.code}/barangays.json`,
        `${psgcApiBase}/cities/${parentEntry.code}/barangays`,
      ]
      : [
        `${psgcApiBase}/municipalities/${parentEntry.code}/barangays.json`,
        `${psgcApiBase}/municipalities/${parentEntry.code}/barangays`,
      ];

    const barangaysData = await loadFirstWorkingJson(endpoints);
    addressState.barangayEntries = sortEntries(barangaysData.map((record) => createEntry(record, "barangay")));
    fillDatalist(barangayList, addressState.barangayEntries);
    barangayInput.disabled = false;
    barangayInput.required = true;
    barangayInput.placeholder = "Start typing a barangay";

    if (addressState.barangayEntries.length === 0) {
      setAddressHint(`Barangays for ${parentEntry.displayName} could not be loaded. You can enter the barangay manually.`);
      barangayInput.setCustomValidity("");
      return;
    }

    setAddressHint(`Selected ${parentEntry.displayName}. Finish by choosing the barangay.`);
  }

  function refreshMunicipalitySuggestions() {
    if (!addressState.selectedProvinceCity) {
      fillDatalist(municipalityList, []);
      return;
    }

    const localityEntries = getLocalityEntriesForProvince(addressState.selectedProvinceCity.code);
    addressState.municipalityEntries = localityEntries;
    fillDatalist(municipalityList, filterEntriesByPrefix(localityEntries, municipalityCityInput.value));
  }

  function refreshBarangaySuggestions() {
    if (addressState.selectedBarangayParent) {
      void loadBarangaysForParent(addressState.selectedBarangayParent).catch(() => {
        const parentName = addressState.selectedBarangayParent?.displayName || "the selected municipality/city";
        setAddressHint(`Barangay suggestions for ${parentName} could not be loaded. You can enter it manually.`);
        barangayInput.disabled = false;
        barangayInput.required = false;
        barangayInput.setCustomValidity("");
      });
    }
  }

  function syncProvinceCitySelection(options = {}) {
    const { autoAdvance = false, validationOnly = false } = options;
    const selectedEntry = resolveEntry(addressState.provinceCityEntries, provinceCityInput.value);

    if (!provinceCityInput.value.trim()) {
      clearAddressSelection();
      return;
    }

    setFieldValidity(
      provinceCityInput,
      Boolean(selectedEntry) || !addressState.lookupReady,
      "Please select a province from the suggestions."
    );

    if (!selectedEntry) {
      clearAddressSelection(true);
      return;
    }

    if (validationOnly) {
      const localityEntries = getLocalityEntriesForProvince(selectedEntry.code);
      const selectedLocality = resolveEntry(localityEntries, municipalityCityInput.value);
      const hasMunicipalityValue = Boolean(municipalityCityInput.value.trim());
      setFieldValidity(
        municipalityCityInput,
        Boolean(selectedLocality) || !hasMunicipalityValue || !addressState.lookupReady,
        "Please select a municipality or city from the suggestions."
      );
      return;
    }

    addressState.selectedProvinceCity = selectedEntry;
    addressState.selectedLocality = null;
    addressState.selectedBarangayParent = null;
    resetBarangayField();

    const localityEntries = getLocalityEntriesForProvince(selectedEntry.code);
    addressState.municipalityEntries = localityEntries;
    fillDatalist(municipalityList, localityEntries);

    municipalityCityInput.disabled = false;
    municipalityCityInput.required = true;
    municipalityCityInput.placeholder = "Start typing a municipality or city";
    municipalityCityInput.value = "";
    municipalityCityInput.setCustomValidity("");
    setAddressHint(`Selected ${selectedEntry.displayName}. Choose the municipality or city next.`);

    if (autoAdvance) {
      municipalityCityInput.focus();
    }

    return;
  }

  function syncMunicipalitySelection(options = {}) {
    const { autoAdvance = false, validationOnly = false } = options;

    if (!addressState.selectedProvinceCity) {
      return;
    }

    const localityEntries = addressState.municipalityEntries;
    const selectedEntry = resolveEntry(localityEntries, municipalityCityInput.value);

    if (!municipalityCityInput.value.trim()) {
      resetBarangayField();
      setAddressHint(`Selected ${addressState.selectedProvinceCity.displayName}. Choose the municipality or city next.`);
      return;
    }

    setFieldValidity(
      municipalityCityInput,
      Boolean(selectedEntry) || !addressState.lookupReady,
      "Please select a municipality or city from the suggestions."
    );

    if (!selectedEntry) {
      resetBarangayField();
      return;
    }

    if (validationOnly) {
      return;
    }

    addressState.selectedLocality = selectedEntry;
    addressState.selectedBarangayParent = selectedEntry;
    loadBarangaysForParent(selectedEntry).then(() => {
      if (autoAdvance) {
        barangayInput.focus();
      }
    }).catch(() => {
      setAddressHint(`Barangay suggestions for ${selectedEntry.displayName} could not be loaded. You can enter it manually.`);
      barangayInput.disabled = false;
      barangayInput.required = false;
      barangayInput.setCustomValidity("");

      if (autoAdvance) {
        barangayInput.focus();
      }
    });
  }

  function syncBarangaySelection() {
    if (barangayInput.disabled) {
      barangayInput.setCustomValidity("");
      return;
    }

    const selectedEntry = resolveEntry(addressState.barangayEntries, barangayInput.value);

    if (!barangayInput.value.trim()) {
      setFieldValidity(barangayInput, true, "");
      return;
    }

    setFieldValidity(
      barangayInput,
      Boolean(selectedEntry) || !addressState.lookupReady,
      "Please select a barangay from the suggestions."
    );
  }

  provinceCityInput.addEventListener("input", () => {
    provinceCityInput.setCustomValidity("");
    municipalityCityInput.closest("label").hidden = false;
    clearAddressSelection();
    fillDatalist(provinceCityList, filterEntriesByPrefix(addressState.provinceCityEntries, provinceCityInput.value));

    if (resolveEntry(addressState.provinceCityEntries, provinceCityInput.value)) {
      syncProvinceCitySelection({ autoAdvance: true });
    }
  });

  provinceCityInput.addEventListener("change", syncProvinceCitySelection);
  provinceCityInput.addEventListener("blur", syncProvinceCitySelection);

  municipalityCityInput.addEventListener("focus", refreshMunicipalitySuggestions);
  municipalityCityInput.addEventListener("input", () => {
    municipalityCityInput.setCustomValidity("");
    barangayInput.value = "";
    barangayInput.setCustomValidity("");
    resetBarangayField();
    fillDatalist(municipalityList, filterEntriesByPrefix(addressState.municipalityEntries, municipalityCityInput.value));

    if (resolveEntry(addressState.municipalityEntries, municipalityCityInput.value)) {
      syncMunicipalitySelection({ autoAdvance: true });
    }
  });

  municipalityCityInput.addEventListener("change", syncMunicipalitySelection);
  municipalityCityInput.addEventListener("blur", syncMunicipalitySelection);

  barangayInput.addEventListener("focus", refreshBarangaySuggestions);
  barangayInput.addEventListener("input", () => {
    barangayInput.setCustomValidity("");
    fillDatalist(barangayList, filterEntriesByPrefix(addressState.barangayEntries, barangayInput.value));

    if (resolveEntry(addressState.barangayEntries, barangayInput.value)) {
      postalCodeInput.focus();
    }
  });

  barangayInput.addEventListener("change", syncBarangaySelection);
  barangayInput.addEventListener("blur", syncBarangaySelection);

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      municipalityCityInput.closest("label").hidden = false;
      clearAddressSelection();
      provinceCityInput.value = "";
      municipalityCityInput.value = "";
      barangayInput.value = "";
      fillDatalist(provinceCityList, addressState.provinceCityEntries);
    }, 0);
  });

  void loadAddressData();

  return {
    syncProvinceCitySelection,
    syncMunicipalitySelection,
    syncBarangaySelection,
  };
}

const addressFields = initializePhilippineAddressFields();

if (form && formMessage) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (addressFields) {
      addressFields.syncProvinceCitySelection({ validationOnly: true });
      addressFields.syncMunicipalitySelection({ validationOnly: true });
      addressFields.syncBarangaySelection();
    }

    if (!form.checkValidity()) {
      formMessage.textContent = "Please complete all required fields.";
      return;
    }

    formMessage.textContent = "Thanks. Your inquiry has been drafted locally.";
    form.reset();
  });
}

backToTopLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

