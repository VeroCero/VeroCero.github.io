// ===== Blog page: the Magic 8 Ball and the bowl of fortune cookies =====

// Magic 8 Ball answers. Replace these placeholders with your own.
// (The classic toy has 20, e.g. 'It is certain.', 'Ask again later.', 'Very doubtful.')
const eightBallAnswers = [
  '[Answer 1]',
  '[Answer 2]',
  '[Answer 3]',
  '[Answer 4]',
  '[Answer 5]',
];

// Fortunes. One is shown per day, in order. `image` is optional: give it a path like
// 'assets/blog/fortune-garden.jpg' and it is printed on the slip like an old, cheap colour printer.
const fortunes = [
  { text: 'Hope means we can change.', image: 'assets/blog/fortunes/hope-cat.webp' },
  { text: '[Another fortune placeholder]', image: '' },
];

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const later = (fn, ms) => setTimeout(fn, reducedMotion() ? 0 : ms);
const restart = (el, className) => {
  el.classList.remove(className);
  void el.offsetWidth; // let the animation play again
  el.classList.add(className);
};

// Close on the yellow ✕, Esc (built in), or a click on the dimmed page outside the object.
const wirePopup = dialog => {
  dialog.querySelector('.nook-pop-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
};

/* ----- Magic 8 Ball ----- */
const ballPop = document.querySelector('#eight-ball-pop');
const bigBall = ballPop.querySelector('.big-ball');
const ballFace = ballPop.querySelector('.big-ball-face');
const ballAnswer = ballPop.querySelector('.big-ball-answer');
let lastAnswer = -1;
let shaking = false;

const pickAnswer = () => {
  let next;
  do next = Math.floor(Math.random() * eightBallAnswers.length);
  while (next === lastAnswer && eightBallAnswers.length > 1);
  lastAnswer = next;
  return eightBallAnswers[next];
};

// The triangle and its answer float up into the window together.
const revealAnswer = () => {
  ballAnswer.textContent = pickAnswer();
  restart(ballFace, 'is-rising');
  bigBall.classList.remove('is-sunk');
};

document.querySelector('#ask-eight-ball').addEventListener('click', () => {
  bigBall.classList.add('is-sunk');
  ballPop.showModal();
  later(revealAnswer, 200);
});

bigBall.addEventListener('click', () => {
  if (shaking) return;
  shaking = true;
  bigBall.classList.add('is-sunk');
  restart(bigBall, 'is-shaking');
  later(() => {
    bigBall.classList.remove('is-shaking');
    revealAnswer();
    shaking = false;
  }, 750);
});
wirePopup(ballPop);

/* ----- Fortune cookies ----- */
const fortunePop = document.querySelector('#fortune-pop');
const slip = fortunePop.querySelector('.fortune-slip');

const today = () => {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000;
};

// Seeded random numbers, so the lucky numbers stay the same all day.
const seeded = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const luckyNumbers = () => {
  const random = seeded(today());
  const numbers = new Set();
  while (numbers.size < 6) numbers.add(1 + Math.floor(random() * 49));
  return [...numbers].sort((a, b) => a - b).join(' · ');
};

// Old cheap colour printer: low resolution, a few ink levels with a dotty dither,
// colour layers a pixel out of line, and faded ink. Streaks are added in CSS.
const printImage = src => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => { try {
    const width = 104;
    const height = Math.round(width * image.naturalHeight / image.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    const source = context.getImageData(0, 0, width, height).data;
    const printed = context.createImageData(width, height);
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const levels = 5;
    const at = (x, y, channel) => {
      x = Math.min(width - 1, Math.max(0, x));
      y = Math.min(height - 1, Math.max(0, y));
      return source[(y * width + x) * 4 + channel];
    };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const dither = ((bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5) * 0.7;
        const band = y % 9 === 0 ? 14 : 0;
        const inks = [at(x + 1, y, 0), at(x, y, 1), at(x, y + 1, 2)];
        // Near-white areas get no ink at all, like a real printer leaving the paper blank.
        if (at(x, y, 0) > 242 && at(x, y, 1) > 242 && at(x, y, 2) > 242) {
          printed.data.set([255, 253, 247, 255], i);
          continue;
        }
        inks.forEach((value, channel) => {
          const faded = value * 0.9 + 18 + band;
          printed.data[i + channel] = Math.max(0, Math.min(255, Math.round((faded / 255) * levels + dither) / levels * 255));
        });
        printed.data[i + 3] = 255;
      }
    }
    context.putImageData(printed, 0, 0);
    resolve(canvas);
  } catch (error) { reject(error); } };
  image.onerror = reject;
  image.src = src;
});

const fillSlip = async () => {
  const fortune = fortunes[today() % fortunes.length];
  slip.classList.toggle('has-image', Boolean(fortune.image));
  slip.innerHTML = `${fortune.image ? '<div class="fortune-print"></div>' : ''}<div class="fortune-words"><p class="fortune-text"></p><p class="fortune-lucky"></p></div>`;
  slip.querySelector('.fortune-text').textContent = fortune.text;
  slip.querySelector('.fortune-lucky').textContent = `Lucky numbers: ${luckyNumbers()}`;
  if (fortune.image) {
    try {
      slip.querySelector('.fortune-print').append(await printImage(fortune.image));
    } catch {
      slip.querySelector('.fortune-print').remove();
      slip.classList.remove('has-image');
    }
  }
};

document.querySelector('#open-fortune').addEventListener('click', () => {
  fillSlip();
  fortunePop.showModal();
});
wirePopup(fortunePop);
