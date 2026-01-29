module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdxts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "accent-dark": "hsl(15, 64%, 86%)",
        "accent-light": "hsl(105, 16%, 43%)",
      },
    },
  },
}

