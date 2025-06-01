import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // обязательно путь до src
  ],
  theme: {
    extend: {
      colors: {
      background: "var(--bg)",
      foreground: "var(--fg)",
    },
  },
  },
  plugins: [],
}

export default config
