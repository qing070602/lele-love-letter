// Tree geometry and rendering: qzydustin/Love-Letter-Website (MIT).
const AnimationConfig = { TREE_SHIFT_X: 0, MAX_FALLING_HEARTS: 12, FALLING_SPAWN_CHANCE: 0.025 };
const experience = document.getElementById("experience");
const letter = document.getElementById("letter");
const lines = [...document.querySelectorAll(".typed-line")];
const replay = document.getElementById("replay");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frameId = 0;
let resetTimer = 0;

function elapsedDays(now = Date.now()) {
  return Math.max(0, Math.floor((now - Date.parse(CONFIG.memorialDate)) / 86400000));
}

function updateDate() {
  document.getElementById("days").textContent = elapsedDays();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  document.getElementById("today").textContent = `${values.year}.${values.month}.${values.day}`;
}

function initCanvas(id) {
  const canvas = document.getElementById(id);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 680 * ratio;
  canvas.height = 740 * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.translate(-210, 20);
  return canvas;
}

function startExperience() {
  cancelAnimationFrame(frameId);
  experience.classList.remove("is-complete");
  letter.classList.remove("is-visible");
  lines.forEach(line => { line.textContent = ""; });
  updateDate();

  const tree = new Tree(initCanvas("static-canvas"), initCanvas("canvas"), initCanvas("ground-canvas"), StageConfig.width, StageConfig.height, TreeShape, CONFIG);
  tree.footer.length = 490;
  tree.footer.draw();
  const still = reducedMotion.matches;
  if (still) {
    while (tree.canGrow()) tree.grow();
    while (tree.canFlower() || tree.blooms.length) tree.flower(40);
    lines.forEach(line => { line.textContent = line.dataset.text; });
    letter.classList.add("is-visible");
    experience.classList.add("is-complete");
    return;
  }

  let previous = 0;
  let elapsed = 0;
  let growth = 0;
  let flowers = 0;
  function animate(now) {
    const dt = previous ? Math.min(now - previous, 40) : 16;
    previous = now;
    elapsed += dt;
    tree.dynamicCtx.clearRect(210, -20, 680, 740);

    if (elapsed < 700) {
      const t = Math.min(elapsed / 700, 1);
      const ctx = tree.dynamicCtx;
      ctx.save();
      ctx.translate(535, 560 + 120 * t * t);
      ctx.scale(1.4 * (1 - t) + .1, 1.4 * (1 - t) + .1);
      ctx.fillStyle = "#db8295";
      ctx.fill(tree.seed.heart.figure.path);
      ctx.restore();
    }
    if (elapsed >= 650 && tree.canGrow()) {
      growth += dt * .15;
      while (growth >= 1 && tree.canGrow()) { tree.grow(); growth--; }
    }
    if (elapsed >= 1800 && (tree.canFlower() || tree.blooms.length)) {
      flowers += dt / 16.667;
      while (flowers >= 1) { tree.flower(6); flowers--; }
    }
    if (elapsed >= 2800) {
      letter.classList.add("is-visible");
      let offset = 3300;
      lines.forEach(line => {
        const chars = Array.from(line.dataset.text);
        const count = Math.max(0, Math.floor((elapsed - offset) / 95));
        line.textContent = chars.slice(0, count).join("");
        offset += chars.length * 95 + 350;
      });
      if (elapsed >= offset) experience.classList.add("is-complete");
    }
    if (elapsed >= 4400) tree.jump(dt);
    frameId = requestAnimationFrame(animate);
  }
  frameId = requestAnimationFrame(animate);
}

replay.addEventListener("click", () => {
  if (replay.disabled) return;
  replay.disabled = true;
  experience.classList.add("is-leaving");
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    startExperience();
    experience.classList.remove("is-leaving");
    replay.disabled = false;
  }, reducedMotion.matches ? 0 : 450);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateDate();
});
reducedMotion.addEventListener("change", startExperience);
setInterval(updateDate, 60000);
startExperience();
