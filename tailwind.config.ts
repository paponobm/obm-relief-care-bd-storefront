import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: { DEFAULT: "var(--leaf)", deep: "var(--leaf-deep)", soft: "var(--leaf-soft)" },
        amber: { DEFAULT: "var(--amber)", deep: "var(--amber-deep)", soft: "var(--amber-soft)" },
        ink: "var(--ink)",
        muted: "var(--muted)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        line: "var(--line)",
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        "custom-dark-green": "#0F2418",
      },
      fontFamily: {
        display: ["'Baloo Da 2'", "'Hind Siliguri'", "system-ui", "sans-serif"],
        body: ["'Hind Siliguri'", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
