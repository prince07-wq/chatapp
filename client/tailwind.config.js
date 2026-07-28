/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      colors: {
        ink: "#000000",
        grey: "#909093",
        "grey-light": "#E8E8E9",
        paper: "#FFFFFF",
        "notify-purple": "#7C75E4",
        "apple-blue": "#3478F6",
        "message-blue": "#0078FF",
        "seen-blue": "#00B7FF",
      },

      borderRadius: {
        input: "18px",
        button: "18px",
        card: "20px",
        bubble: "20px",
        image: "16px",
      },
    },
  },

  plugins: [],
};