// Abby the owl. The mood (idle, happy, cheer, oops, think) is a data attribute; CSS does the animating.
const OWL = `<svg class="abby-svg" viewBox="0 0 120 130" aria-hidden="true" focusable="false">
  <g class="feet"><ellipse cx="46" cy="123" rx="13" ry="6" fill="#ffb02e"/><ellipse cx="74" cy="123" rx="13" ry="6" fill="#ffb02e"/></g>
  <g class="wing wing-l"><ellipse cx="19" cy="82" rx="11" ry="27" fill="#5f3fc0"/></g>
  <g class="wing wing-r"><ellipse cx="101" cy="82" rx="11" ry="27" fill="#5f3fc0"/></g>
  <ellipse cx="60" cy="80" rx="40" ry="43" fill="#8467f0"/>
  <ellipse cx="60" cy="90" rx="27" ry="31" fill="#f4ecff"/>
  <circle cx="60" cy="96" r="12" fill="#fff" stroke="#ff5fa2" stroke-width="3"/>
  <path d="M60 96V88M60 96l6 3" stroke="#6a4fd8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <g class="head">
    <path d="M22 36 30 8 50 24Z" fill="#8467f0"/><path d="M98 36 90 8 70 24Z" fill="#8467f0"/>
    <ellipse cx="60" cy="48" rx="42" ry="35" fill="#8467f0"/>
    <g class="eyes"><circle cx="43" cy="48" r="16" fill="#fff"/><circle cx="77" cy="48" r="16" fill="#fff"/>
      <g class="pupils"><circle cx="45" cy="50" r="8" fill="#2b2142"/><circle cx="75" cy="50" r="8" fill="#2b2142"/><circle cx="48" cy="46" r="2.8" fill="#fff"/><circle cx="78" cy="46" r="2.8" fill="#fff"/></g>
    </g>
    <g class="happy-eyes" fill="none" stroke="#2b2142" stroke-width="5" stroke-linecap="round"><path d="M33 52Q43 38 53 52"/><path d="M67 52Q77 38 87 52"/></g>
    <g class="brows" fill="none" stroke="#2b2142" stroke-width="4" stroke-linecap="round"><path d="M28 34 52 27"/><path d="M92 34 68 27"/></g>
    <ellipse cx="27" cy="62" rx="6" ry="4" fill="#ff9ec7" opacity=".75"/><ellipse cx="93" cy="62" rx="6" ry="4" fill="#ff9ec7" opacity=".75"/>
    <path d="M53 56h14l-7 14Z" fill="#ffb02e" stroke="#e08a00" stroke-width="1.5" stroke-linejoin="round"/>
  </g>
</svg><span class="acc" aria-hidden="true"></span>`;

export function createMascot(container) {
  container.classList.add('abby');
  container.dataset.mood = 'idle';
  container.innerHTML = OWL;
  const accessory = container.querySelector('.acc');
  let timer;
  return {
    // A timed mood falls back to idle so Abby never gets stuck looking worried.
    setMood(mood, ms = 0) {
      clearTimeout(timer);
      container.dataset.mood = mood;
      if (ms) timer = setTimeout(() => { container.dataset.mood = 'idle'; }, ms);
    },
    wear(sticker) {
      accessory.textContent = sticker ? sticker.emoji : '';
      accessory.dataset.slot = sticker ? sticker.slot : '';
    },
  };
}
