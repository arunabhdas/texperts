import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ghibli: {
          deep: "#1a1520",
          bg: "#211c28",
          surface: "#2a2433",
          elevated: "#342d3d",
          border: "#3d3548",
          "border-subtle": "#2f2938",
          text: "#e8dfd0",
          secondary: "#a89e8c",
          muted: "#7a7068",
          gold: "#d4a857",
          warm: "#c4956a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
