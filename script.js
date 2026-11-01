
const frameImage = document.getElementById("scroll-frame");
const scene = document.querySelector(".scroll-scene");
const background = document.querySelector(".scene-background");

const frameGroups = [
  { prefix: "a", count: 226, digits: 3 },
  { prefix: "frame_", count: 157, digits: 4 },
];

const frames = [];

frameGroups.forEach((group) => {
  for (let i = 1; i <= group.count; i++) {
    frames.push(
      `frames/${group.prefix}${String(i).padStart(group.digits, "0")}.webp`
    );
  }
});

const portraitCount = frameGroups[0].count;
const totalFrames = frames.length;

// One viewport dedicated to the crossfade transition.
const transitionScreens = 1;

const landscapeImage = document.createElement("img");
landscapeImage.id = "landscape-transition-frame";
landscapeImage.alt = "";
landscapeImage.setAttribute("aria-hidden", "true");
background.appendChild(landscapeImage);

frameImage.classList.add("portrait-frame");
landscapeImage.classList.add("landscape-frame");

const imageCache = new Map();

let currentPortrait = -1;
let currentLandscape = -1;
let requestedPortrait = -1;
let requestedLandscape = -1;
let ticking = false;

function getFrame(index) {
  if (imageCache.has(index)) return imageCache.get(index);

  const img = new Image();
  img.src = frames[index];
  imageCache.set(index, img);

  return img;
}

function displayFrame(index, target, layer) {
  const img = getFrame(index);

  function applyFrame() {
    if (layer === "portrait" && requestedPortrait !== index) return;
    if (layer === "landscape" && requestedLandscape !== index) return;
    if (!img.naturalWidth) return;

    target.src = img.src;

    if (layer === "portrait") {
      currentPortrait = index;
    } else {
      currentLandscape = index;
    }
  }

  if (img.complete && img.naturalWidth > 0) {
    applyFrame();
  } else {
    img.decode().then(applyFrame).catch(() => {
      // Keep the previous image if a frame fails to load.
    });
  }
}

function showPortrait(index) {
  if (index === currentPortrait || index === requestedPortrait) return;

  requestedPortrait = index;
  displayFrame(index, frameImage, "portrait");
}

function showLandscape(index) {
  if (index === currentLandscape || index === requestedLandscape) return;

  requestedLandscape = index;
  displayFrame(index, landscapeImage, "landscape");
}

function updateFrame() {
  ticking = false;

  const scrollDistance = scene.offsetHeight - window.innerHeight;
  if (scrollDistance <= 0) return;

  const rect = scene.getBoundingClientRect();

  const scrollProgress = Math.max(
    0,
    Math.min(1, -rect.top / scrollDistance)
  );

  // Reserve one viewport of scroll distance for the transition.
  const transitionProgress = Math.min(
    0.99,
    (window.innerHeight / scrollDistance) * transitionScreens
  );

  // Split the remaining scroll proportionally between both sequences.
  const contentProgress = 1 - transitionProgress;
  const portraitShare = (portraitCount - 1) / (totalFrames - 1);

  const transitionStart = contentProgress * portraitShare;

  let portraitIndex = portraitCount - 1;

  if (scrollProgress <= transitionStart) {
    const progress = transitionStart > 0
      ? scrollProgress / transitionStart
      : 1;

    portraitIndex = Math.round(
      Math.max(0, Math.min(1, progress)) * (portraitCount - 1)
    );
  }

  // The landscape sequence begins behind the portrait and advances
  // throughout the transition and the remaining scroll.
  const landscapeProgress = Math.max(
    0,
    Math.min(
      1,
      (scrollProgress - transitionStart) / (1 - transitionStart)
    )
  );

  const landscapeIndex =
    portraitCount +
    Math.round(landscapeProgress * (totalFrames - portraitCount - 1));

  // Crossfade between the last portrait frame and the landscape sequence.
  const fade = Math.max(
    0,
    Math.min(
      1,
      (scrollProgress - transitionStart) / transitionProgress
    )
  );

  showPortrait(portraitIndex);
  showLandscape(landscapeIndex);

  frameImage.style.opacity = String(1 - fade);
  landscapeImage.style.opacity = String(fade);

  // Preload nearby frames for smoother scrolling.
  for (let step = 1; step <= 3; step++) {
    const portraitNext = portraitIndex + step;
    const landscapeNext = landscapeIndex + step;

    if (portraitNext < portraitCount) getFrame(portraitNext);
    if (landscapeNext < totalFrames) getFrame(landscapeNext);
  }
}

function requestUpdate() {
  if (ticking) return;

  ticking = true;
  requestAnimationFrame(updateFrame);
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);

// Initialize both image layers.
showPortrait(0);
showLandscape(portraitCount);
requestUpdate();


// Hero text transitions controlled by scrolling.

const hero = document.querySelector(".hero");
const heroCopy = document.querySelector(".hero-copy");
const heroSequence = document.querySelector(".hero-sequence");
const heroPhrases = document.querySelectorAll(".hero-phrase");
const heroDescriptions = document.querySelectorAll(".hero-description");



function updateHero() {
  if (!hero || !heroCopy || !heroSequence || !heroPhrases.length) {
    return;
  }

  const rect = hero.getBoundingClientRect();
  const scrollProgress = Math.max(0, -rect.top);
  const scrollY = scrollProgress / window.innerHeight;

  // Independent scroll intervals for each phrase.
  const phraseStages = [
    { phrase: 0, start: 0, end: 0.5 },
    { phrase: 1, start: 0.5, end: 1.6 },
    { phrase: 2, start: 1.6, end: 2.4 },
    { phrase: 3, start: 2.4, end: 3.2 },
  ];

  // Determine the current stage BEFORE updating headings or descriptions.
  const currentStage = phraseStages.find((stage) => {
    return scrollY >= stage.start && scrollY < stage.end;
  });

  // Update headings.
  heroPhrases.forEach((phrase, index) => {
    phrase.classList.toggle(
      "active",
      currentStage !== undefined && index === currentStage.phrase
    );
  });

  // Update descriptions in sync with the headings.
  heroDescriptions.forEach((description, index) => {
    description.classList.toggle(
      "active",
      currentStage !== undefined && index === currentStage.phrase
    );
  });

  // Keep the eyebrow hidden after the phrase sequence begins.
  heroSequence.classList.toggle("phrase-mode", scrollY >= 0.8);
}


window.addEventListener("scroll", updateHero, { passive: true });
window.addEventListener("resize", updateHero);

updateHero();
