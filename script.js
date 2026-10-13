// Set this to 'assets/mii.png' after adding your transparent Mii image.
const miiImagePath = '';
const avatar = document.querySelector('.avatar-placeholder');
if (avatar && miiImagePath) {
  const mii = new Image();
  mii.alt = 'Veronica’s Mii avatar';
  mii.width = 200;
  mii.height = 240;
  mii.style.cssText = 'width:200px;height:240px;object-fit:contain';
  mii.onload = () => avatar.replaceChildren(mii);
  mii.src = miiImagePath;
}

// Add a path and descriptive alt text here when an image is ready.
// Keys match data-image-slot attributes in the HTML. Empty paths keep placeholders.
const portfolioImages = {
  'home-game': { src: '', alt: '' },
  'home-linux': { src: '', alt: '' },
  'work-mri': { src: '', alt: '' },
  'work-slac': { src: '', alt: '' },
  'work-circuits': { src: '', alt: '' },
  'work-card-party': { src: '', alt: '' },
  'work-linux': { src: '', alt: '' },
  'about-portrait': { src: '', alt: '' },
  'about-personal': { src: '', alt: '' },
  'about-community': { src: '', alt: '' },
  'contact-mii': { src: '', alt: '' },
  'notes': { src: '', alt: '' },
  'gratitude': { src: '', alt: '' },
};
document.querySelectorAll('[data-image-slot]').forEach(slot => {
  const asset = portfolioImages[slot.dataset.imageSlot];
  if (!asset?.src || !asset.alt) return;
  const img = new Image();
  img.alt = asset.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onload = () => {
    slot.querySelector('.image-slot-space').replaceChildren(img);
    slot.classList.add('has-image');
    slot.querySelector('figcaption').textContent = asset.caption || asset.alt;
  };
  img.src = asset.src;
});
const noticeToggle = document.querySelector('.progress-toggle');
noticeToggle?.addEventListener('click', () => {
  const paused = noticeToggle.closest('.progress-notice').classList.toggle('is-paused');
  noticeToggle.setAttribute('aria-pressed', String(paused));
  noticeToggle.setAttribute('aria-label', paused ? 'Resume scrolling notice' : 'Pause scrolling notice');
  noticeToggle.textContent = paused ? '▷' : 'Ⅱ';
});
// The taped header tabs remain inactive; other links use the temporary page.
document.querySelectorAll('.nav-construction a').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
  link.addEventListener('auxclick', event => event.preventDefault());
});
// A one-time nod to “Hello, Zuko here,” before the real introduction.
const introName = document.querySelector('.intro-name');
if (introName && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const finalName = introName.textContent;
  introName.textContent = 'Zuko';
  introName.classList.add('is-zuko');
  document.fonts.ready.then(() => {
    // Reserve the final name's width so the heading doesn't jump during the joke.
    const measure = introName.cloneNode(true);
    measure.textContent = finalName;
    measure.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    introName.parentElement.append(measure);
    const zukoMeasure = measure.cloneNode(true);
    zukoMeasure.textContent = 'Zuko';
    introName.parentElement.append(zukoMeasure);
    introName.style.setProperty('--strike-width', `${zukoMeasure.getBoundingClientRect().width}px`);
    zukoMeasure.remove();
    introName.style.minWidth = `${measure.getBoundingClientRect().width}px`;
    measure.remove();
    window.setTimeout(() => introName.classList.add('is-crossed'), 950);
    window.setTimeout(() => {
      introName.textContent = finalName;
      introName.classList.remove('is-zuko', 'is-crossed');
      introName.classList.add('is-revealed');
    }, 1350);
  });
}
