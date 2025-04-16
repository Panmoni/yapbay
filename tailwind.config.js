/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          // Deep Navy
          900: "#1a365d",
          800: "#1e4976",
          700: "#2c5282",
          600: "#2b6cb0", // Main primary
          500: "#3182ce",
        },
        secondary: {
          // Mint Green
          500: "#38b2ac", // Main secondary
          400: "#4fd1c5",
          300: "#81e6d9",
        },
        neutral: {
          // Neutral Tones
          900: "#1a202c",
          800: "#2d3748",
          700: "#4a5568",
          600: "#718096",
          500: "#a0aec0",
          400: "#cbd5e0",
          300: "#e2e8f0",
          200: "#edf2f7",
          100: "#f7fafc", // Use for bg-primary
        },
        // Accent Colors
        success: "#48bb78",
        warning: "#ed8936",
        error: "#f56565",
        // Background Colors (using neutral for consistency, can be aliased if needed)
        'bg-primary': 'var(--neutral-100)', // Alias for page background
        'bg-secondary': 'var(--neutral-200)', // Alias for card/section backgrounds
        'bg-tertiary': 'var(--neutral-300)', // Alias for highlighted backgrounds
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "0.625rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      fontWeight: {
        black: 900,
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        header: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
