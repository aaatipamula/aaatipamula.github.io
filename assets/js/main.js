// Global keys pressed
const pressedKeys = new Set();
let isPageOverlayShowing = false;

const shortPaths = {
  '/media': '/interests/media',
}

// Timeout function
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

/**
  * General purpose function to hide element children
  * @param { HTMLElement } elemID 
  * @returns { void }
  */
function hideChildren(elemID) {
  const elem = document.getElementById(elemID);
  for (const child of elem.children) {
    child.style.visibility = 'hidden';
  }
}

/**
  * Replace all the github links in the document
  * @param { string } elemID
  * @returns { void }
  */
function replaceLinks(elemID) {
  const content = document.getElementById(elemID);
  const host = window.location.host;
  for (const link of content.querySelectorAll('a')) {
    if (link.href.startsWith('https:\/\/github\.com') && link.innerText == 'Link') {
      link.innerHTML = '<i class="bi bi-github"></i>';
    } else if (link.href.startsWith(`https://${host}/`) || link.hostname === 'localhost') {
      console.log('htmx-swapping:', link.href);
      link.setAttribute('hx-get', link.href);
      link.setAttribute('hx-target', '#page-overlay-container');
      link.setAttribute('hx-swap', 'innerHTML');
      link.addEventListener('click', () => {
        if (!isPageOverlayShowing) {
          togglePage();
        }
      });
      link.setAttribute('href', '');
    }
  }
}

/**
  * Animate my signature
  * @param { string } signatureID
  * @param { number } durationMultiplier
  * @returns { void }
  */
async function animateSignature(signatureID, durationMultiplier) {
  const signature = document.getElementById(signatureID);

  for (const child of signature.getElementsByTagName('path')) {
    child.style.visibility = 'visible';

    let signatureLen = child.getTotalLength();
    let duration = Math.floor(signatureLen * durationMultiplier);

    child.style.strokeDasharray = signatureLen + ' ' + signatureLen;
    child.style.strokeDashoffset = signatureLen;

    let animation = child.animate(
      [{strokeDashoffset: signatureLen}, {strokeDashoffset: 0}],
      {duration: duration, iterations: 1}
    );

    animation.onfinish = () => {
      child.style.strokeDasharray = 0;
      child.style.strokeDashoffset = 0;
    }

    await sleep(duration);
  }

  signature.querySelector('circle').style.visibility = 'visible';
}

/**
  * Toggle the css theme
  * @returns { void }
  */
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement
    .classList.contains('dark') ? 'dark' : 'light';
}

/**
  * Initalize the css theme
  * @returns { void }
  */
function initTheme() {
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Decision hierarchy: localStorage > system preference
  if (storedTheme) {
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  } else {
    document.documentElement.classList.toggle('dark', prefersDark);
  }
}

/**
  * Hide/show the overlay page
  * @returns { void }
  */
function togglePage() {
  const overlayContainer = document.getElementById("page-overlay-container");
  overlayContainer.classList.toggle("opacity-100");
  overlayContainer.classList.toggle("pointer-events-none");
  isPageOverlayShowing = !isPageOverlayShowing;
}

/**
  * TODO: Return multiple codes for numbers, F keys, and special characters etc
  * @param { string } keyCode
  * @returns { number }
  */
function getId(keyCode) {
  switch (keyCode) {
    case 'Escape': return 1;
    case 'KeyQ': return 2;
    case 'KeyW': return 3;
    case 'KeyE': return 4;
    case 'KeyR': return 5;
    case 'KeyT': return 6;
    case 'KeyY': return 7;
    case 'KeyU': return 8;
    case 'KeyI': return 9;
    case 'KeyO': return 10;
    case 'KeyP': return 11;
    case 'Backspace': return 12;

    case 'Tab': return 13;
    case 'KeyA': return 14;
    case 'KeyS': return 15;
    case 'KeyD': return 16;
    case 'KeyF': return 17;
    case 'KeyG': return 18;
    case 'KeyH': return 19;
    case 'KeyJ': return 20;
    case 'KeyK': return 21;
    case 'KeyL': return 22;
    case 'Semicolon': return 23;
    case 'Enter': return 24;

    case 'ShiftLeft': return 25;
    case 'KeyZ': return 26;
    case 'KeyX': return 27;
    case 'KeyC': return 28;
    case 'KeyV': return 29;
    case 'KeyB': return 30;
    case 'KeyN': return 31;
    case 'KeyM': return 32;
    case 'Comma': return 33;
    case 'Period': return 34;
    case 'Slash': return 35;
    case 'ShiftRight': return 36;

    case 'MetaLeft': return 37;
    case 'MetaRight': return 37;
    case 'ControlLeft': return 38;
    case 'Space': return 41;
    case 'AltLeft': return 42;
    case 'AltRight': return 42;

    default: return 0;
  }
}

/**
  * @param { number[] } ids
  * @returns { void }
  */
function toggleElemId(...ids) {
  if (ids.length === 0) return;
  for (const id of ids) {
    if (id === 0) continue;
    const key = document.getElementById(`key_${id}`);
    key.classList.toggle('opacity-40');
  }
}

/**
  * NOTE: Maybe refactor this
  * @param { KeyboardEvent } event
  * @param { HTMLInputElement } navElement
  * @returns { void }
  */
function processActions(event, navElement) {
  switch (event.code) {
    case 'Tab':
      event.preventDefault();
      navElement.focus();
      break;

    case 'Slash':
      if (document.activeElement != navElement) {
        event.preventDefault();
        navElement.value = "/";
        navElement.focus();
      }
      break;

    case 'Semicolon':
      if (event.shiftKey) {
        navElement.focus();
      }
      break;

    case 'Escape':
      if (isPageOverlayShowing) {
        togglePage();
      }
      navElement.value = "";
      document.documentElement.focus();
      break;

    default:
      break;
  }
}

/**
  * @param { string } str
  * @returns { void }
  */
function evalNav(str) {
  const validSlug = /^(\/(?!-)[a-z0-9-]+(?<!-))*$/gmi
  if (str === ':tt') {
    return toggleTheme();
  } else if (str === '/') {
    return togglePage();
  } else if (str.match(validSlug)) {
    const path = shortPaths[str] || str
    console.log('htmx-getting-path:', path)
    htmx.ajax('GET', path, {
      target: '#page-overlay-container',
      swap: 'innerHTML',
    });
    if (!isPageOverlayShowing) {
      togglePage();
    }
  }
}

window.addEventListener("keydown", (event) => {
  const nav = document.getElementById("navigation");
  processActions(event, nav);
  if (!pressedKeys.has(event.code)) {
    pressedKeys.add(event.code);
    toggleElemId(getId(event.code));
  }
  if (document.activeElement === nav && event.code === 'Enter') {
    evalNav(nav.value)
    nav.value = "";
  }
});

window.addEventListener("keyup", (event) => {
  if (pressedKeys.has(event.code)) {
    pressedKeys.delete(event.code);
    toggleElemId(getId(event.code));
  }
});

window.addEventListener("focus", () => {
  for (const key of pressedKeys) {
    toggleElemId(getId(key));
    pressedKeys.delete(key);
  }
});

window.addEventListener('load', () => animateSignature('signature', 1.18));
