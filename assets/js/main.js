function toggleTheme() {
  const htmlEl = document.documentElement;
  htmlEl.classList.toggle('dark');
  localStorage.theme = htmlEl.classList.contains('dark') ? 'dark' : 'light';
}

function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');

  // Decision hierarchy: localStorage > system preference
  if (storedTheme) {
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  } else {
    document.documentElement.classList.toggle('dark', prefersDark);
  }
}

// TODO: Return multiple codes for numbers, F keys, and special characters etc
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

const pressedKeys = new Set();

function toggleElemId(id) {
  if (id === 0) return;
  const key = document.getElementById(`key_${id}`);
  key.classList.toggle('opacity-50');
}

// NOTE: Maybe refator this
function processActions(event, navElement) {
  switch (event.code) {
    case 'Tab':
      event.preventDefault();
      navElement.focus();
      break;

    case 'Slash':
      event.preventDefault();
      navElement.value = "/";
      navElement.focus();
      break;

    case 'Escape':
      navElement.value = "";
      navElement.focus();
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
  if (str === '/tt') {
    toggleTheme();
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
    pressedKeys.delete(key);
    toggleElemId(getId(key));
  }
});

