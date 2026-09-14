const container = document.getElementById('container');
const screen = document.getElementById('loading-screen');
const status = document.getElementById('status');
const activity = document.getElementById('activity');
const retry = document.getElementById('retry');
const discoveryToast = document.getElementById('discovery-toast');
const dismissDiscovery = document.getElementById('dismiss-discovery');
let current;
let running = false;
let easterEggFound = false;
let toastTimer;

function hideDiscovery() {
  clearTimeout(toastTimer);
  discoveryToast.classList.remove('is-visible');
  discoveryToast.setAttribute('aria-hidden', 'true');
}

function showDiscovery() {
  if (easterEggFound) return;
  easterEggFound = true;
  discoveryToast.classList.add('is-visible');
  discoveryToast.setAttribute('aria-hidden', 'false');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideDiscovery, 5200);
}

function fail() {
  current?.dispose();
  current = undefined;
  running = false;
  document.body.dataset.state = 'error';
  screen.inert = false;
  screen.removeAttribute('aria-hidden');
  container.setAttribute('aria-busy', 'false');
  status.textContent = 'Interactive 3D couldn’t load.';
  activity.hidden = true;
  retry.hidden = false;
  retry.disabled = false;
}

async function start() {
  if (running) return;
  running = true;
  current?.dispose();
  current = undefined;
  document.body.dataset.state = 'loading';
  screen.inert = false;
  screen.removeAttribute('aria-hidden');
  container.setAttribute('aria-busy', 'true');
  status.textContent = 'Loading the city…';
  activity.hidden = false;
  retry.hidden = true;
  retry.disabled = true;
  try {
    // Keep the poster independent of the heavy WebGL bundle and catch import failures.
    const { createExperience } = await import('./scene.js');
    current = await createExperience(container, {
      onFailure: fail,
      onLobsterFound: showDiscovery,
      onProgress(event) {
        // This is model download progress, not a fabricated total-city percentage.
        if (event.lengthComputable && event.total > 0 && event.loaded < event.total) {
          status.textContent = `Loading the city… Model ${Math.floor(event.loaded / event.total * 100)}%`;
        } else {
          status.textContent = 'Loading the city…';
        }
      },
    });
    document.body.dataset.state = 'ready';
    container.setAttribute('aria-busy', 'false');
    screen.setAttribute('aria-hidden', 'true');
    screen.inert = true;
  } catch {
    fail();
  } finally {
    running = false;
  }
}

retry.addEventListener('click', start);
dismissDiscovery.addEventListener('click', hideDiscovery);
start();
