import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./apps/**/*.{ts,tsx}", "./packages/ui/**/*.{ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
