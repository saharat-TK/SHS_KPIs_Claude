import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand / primary
        primary: "#416900",
        "primary-dark": "#5a8d00",
        "primary-container": "#76b900",
        "primary-fixed": "#aff74e",
        "primary-fixed-dim": "#94da32",
        "inverse-primary": "#94da32",
        "on-primary": "#ffffff",
        "on-primary-container": "#284400",
        "on-primary-fixed": "#102000",
        "on-primary-fixed-variant": "#304f00",
        "surface-tint": "#416900",

        // Secondary / tertiary
        secondary: "#5e5e5e",
        "secondary-container": "#e2e2e2",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#646464",
        tertiary: "#5d5f5f",
        "tertiary-container": "#a6a7a7",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#3b3d3d",

        // Surfaces
        background: "#f9f9f9",
        surface: "#f9f9f9",
        "surface-soft": "#f7f7f7",
        "surface-bright": "#f9f9f9",
        "surface-dim": "#dadada",
        "surface-variant": "#e2e2e2",
        "surface-lowest": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f4",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f0f1f1",

        // Text / lines
        ink: "#000000",
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#424936",
        "on-background": "#1a1c1c",
        mute: "#757575",
        stone: "#898989",
        outline: "#727a64",
        "outline-variant": "#c1cab1",
        hairline: "#cccccc",
        "hairline-strong": "#5e5e5e",

        // Semantic
        success: "#3f8500",
        warning: "#df6500",
        error: "#e52020",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "link-blue": "#0046a4",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        section: "56px",
        tiny: "2px",
        xs: "4px",
        sm: "6px",
        base: "8px",
        md: "12px",
        lg: "14px",
        xl: "20px",
        xxl: "28px",
      },
      fontFamily: {
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["46px", { lineHeight: "1.08", letterSpacing: "-0.5px", fontWeight: "700" }],
        "display-lg": ["34px", { lineHeight: "1.1", fontWeight: "700" }],
        "display-md": ["26px", { lineHeight: "1.1", fontWeight: "700" }],
        "heading-xl": ["20px", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-lg": ["18px", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-md": ["15px", { lineHeight: "1.25", fontWeight: "700" }],
        "body-strong": ["15px", { lineHeight: "1.25", fontWeight: "700" }],
        "body-md": ["14px", { lineHeight: "1.25" }],
        "body-sm": ["13px", { lineHeight: "1.25" }],
        "label-md": ["12px", { lineHeight: "1.25", letterSpacing: "0.1px", fontWeight: "500" }],
        "caption-sm": ["11px", { lineHeight: "1.25" }],
        "utility-xs": ["10px", { lineHeight: "1.25", letterSpacing: "0.5px", fontWeight: "700" }],
      },
      maxWidth: {
        canvas: "1440px",
      },
      boxShadow: {
        chrome: "0 0 5px 0 rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
