// Global keys pressed
const pressedKeys = new Set();
// Aliased paths
const shortPaths = {
  '/media': '/interests/media',
}

// Is the page overlay showing?
let isPageOverlayShowing = false;
// Import and cache the sitemap
let sitemapUrls = null;
// Check to see if a modifier is pressed
let lmodCount = 0;
let rmodCount = 0;

// Timeout function
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

async function loadSitemap() {
  if (sitemapUrls) return sitemapUrls;
  
  try {
    const response = await fetch('/sitemap.json');
    sitemapUrls = await response.json();
    console.log(sitemapUrls);
    return sitemapUrls;
  } catch (error) {
    console.error('Failed to load sitemap:', error);
    return [];
  }
}

/**
 * Find the best matching URL from the sitemap
 * @param {string} query - The search query or partial URL
 * @returns {Promise<string>} - The best matching relative path or empty string
 */
async function findBestMatch(query) {
  if (!query || typeof query !== 'string') return '';
  
  const urls = await loadSitemap();
  if (!urls || urls.length === 0) return '';
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Score each URL based on different matching criteria
  const scored = urls.map(url => {
    const normalizedUrl = url.toLowerCase();
    
    let score = 0;
    
    // Exact match (highest priority)
    if (normalizedUrl === normalizedQuery) {
      score = 1000;
    }
    // URL ends with query
    else if (normalizedUrl.endsWith(normalizedQuery)) {
      score = 500;
    }
    // URL starts with query
    else if (normalizedUrl.startsWith(normalizedQuery)) {
      score = 400;
    }
    // Contains the full query
    else if (normalizedUrl.includes(normalizedQuery)) {
      score = 300;
    }
    // Check individual words in the query
    else {
      const queryWords = normalizedQuery.split(/[\s\-_/]+/).filter(w => w.length > 2);
      const matchedWords = queryWords.filter(word => normalizedUrl.includes(word));
      
      if (matchedWords.length > 0) {
        score = (matchedWords.length / queryWords.length) * 200;
      }
    }
    
    // Bonus for shorter URLs (more specific pages)
    if (score > 0) {
      const pathSegments = url.split('/').filter(s => s.length > 0);
      score -= pathSegments.length * 5;
    }
    
    return { url, score };
  });
  
  // Sort by score and get the best match
  scored.sort((a, b) => b.score - a.score);
  
  // Only return a match if the score is above a threshold
  const bestMatch = scored[0];
  const MIN_SCORE = 50;
  
  return bestMatch && bestMatch.score >= MIN_SCORE ? bestMatch.url : '';
}

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
  * BUG: Layer keys don't have a keycode to attach to them which means
  *      They toggle on/off when multiple keys with the same layer bind are pressed
  * @param { string } key - This should be KeyboardEvent.key
  * @param { number } key - This should be the lcoation of the key (1, 2) for (left, right) respectively
  * @returns { number[] }
  */
function getIds(key, location = 1) {
  switch (key) {
    // Layer Down 
    // R1
    case '`': return [39, 1];
    case '1': return [39, 2];
    case '2': return [39, 3];
    case '3': return [39, 4];
    case '4': return [39, 5];
    case '5': return [39, 6];
    case '6': return [39, 7];
    case '7': return [39, 8];
    case '8': return [39, 9];
    case '9': return [39, 10];
    case '0': return [39, 11];
    case 'Delete': return [39, 11];
    // R2
    case '~': return [39, 1];
    case 'ArrowLeft':  return [39, 19];
    case 'ArrowDown':  return [39, 20];
    case 'ArrowUp':    return [39, 21];
    case 'ArrowRight': return [39, 22];

    // Layer Up
    // R1
    case '!': return [40, 2];
    case '@': return [40, 3];
    case '#': return [40, 4];
    case '$': return [40, 5];
    case '%': return [40, 6];
    case '%': return [40, 7];
    case '^': return [40, 8];
    case '&': return [40, 9];
    case '*': return [40, 10];
    case '(': return [40, 11];
    case ')': return [40, 12];
    // R2
    case '\'': return [40, 13];
    case '-': return [40, 14];
    case '=': return [40, 15];
    case '[': return [40, 16];
    case ']': return [40, 17];
    case '\\': return [40, 18];
    // R3
    case '"': return [40, 25];
    case '_': return [40, 26];
    case '+': return [40, 27];
    case '{': return [40, 28];
    case '}': return [40, 29];
    case '|': return [40, 30];

    // Layer Norm
    // R1
    case 'Q': case 'q': return [2];
    case 'W': case 'w': return [3];
    case 'E': case 'e': return [4];
    case 'R': case 'r': return [5];
    case 'T': case 't': return [6];
    case 'Y': case 'y': return [7];
    case 'U': case 'u': return [8];
    case 'I': case 'i': return [9];
    case 'O': case 'o': return [10];
    case 'P': case 'p': return [11];
    case 'Backspace': return [12];
    // R2
    case 'Tab': return [13];
    case 'A': case 'a': return [14];
    case 'S': case 's': return [15];
    case 'D': case 'd': return [16];
    case 'F': case 'f': return [17];
    case 'G': case 'g': return [18];
    case 'H': case 'h': return [19];
    case 'J': case 'j': return [20];
    case 'K': case 'k': return [21];
    case 'L': case 'l': return [22];
    case ':': case ';': return [23];
    case 'Enter': return [24];
    // R3
    case 'Z': case 'z': return [26];
    case 'X': case 'x': return [27];
    case 'C': case 'c': return [28];
    case 'V': case 'v': return [29];
    case 'B': case 'b': return [30];
    case 'N': case 'n': return [31];
    case 'M': case 'm': return [32];
    case '<': case ',': return [33];
    case '>': case '.': return [34];
    case '?': case '/': return [35];
    case 'Shift': 
      if (location === 1) return [25];  
      else if (location === 2) return [36];
    // R4
    case 'Control': return [38];
    case 'Space': return [41];
    case 'Meta': return [37];
    case 'Alt': return [42];

    default: return [0];
  }
}

/**
  * @param { number[] } ids - the list of ids to toggle
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

window.addEventListener("keydown", async (event) => {
  const nav = document.getElementById("navigation");
  processActions(event, nav);
  if (!pressedKeys.has(event.code)) {
    pressedKeys.add(event.code);
    toggleElemId(...getIds(event.key, event.location));
  }
  if (document.activeElement === nav) {
    const predictPath = await findBestMatch(nav.value);
    console.log(predictPath);
    if (event.code === 'Enter') {
      evalNav(nav.value)
      nav.value = "";
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (pressedKeys.has(event.code)) {
    pressedKeys.delete(event.code);
    toggleElemId(...getIds(event.key, event.location));
  }
});

window.addEventListener("focus", () => {
  for (const key of pressedKeys) {
    toggleElemId(...getIds(key));
    pressedKeys.delete(key);
  }
});

window.addEventListener('load', () => animateSignature('signature', 1.18));
