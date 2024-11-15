const mystTheme = require('@myst-theme/styles');

module.exports = {
  darkMode: 'class',
  content: mystTheme.content.map((s) => s.replace('node_modules/', '../node_modules/')),
  theme: {
    extend: {
      ...mystTheme.themeExtensions,
      colors: {
        'curvenote-blue': '#225f9c',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  safelist: mystTheme.safeList,
};
