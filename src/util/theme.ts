export function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement
    .classList.contains('dark') ? 'dark' : 'light';
}

export function initTheme() {
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Decision hierarchy: localStorage > system preference
  if (storedTheme) {
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  } else {
    document.documentElement.classList.toggle('dark', prefersDark);
  }
}
