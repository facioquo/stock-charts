import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Indy Charts",
  description: "Financial charting with @facioquo/indy-charts",
  appearance: "dark",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/assets/icons/favicon.svg" }],
    ["link", { rel: "icon", type: "image/x-icon", href: "/assets/icons/favicon.ico" }],
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/assets/icons/favicon-32x32.png" }],
    ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/assets/icons/favicon-16x16.png" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/icons/apple-touch-icon.png" }]
  ],

  vite: {
    ssr: {
      noExternal: ["@facioquo/indy-charts", "chartjs-adapter-date-fns", "chart.js", "date-fns"]
    }
  },

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      { text: "Examples", link: "/examples/" }
    ],

    sidebar: [
      {
        text: "Getting started",
        items: [
          { text: "Introduction", link: "/guide/" },
          { text: "Installation", link: "/guide/installation" },
          { text: "Quick start", link: "/guide/quick-start" },
          { text: "Theme customization", link: "/guide/themes" }
        ]
      },
      {
        text: "Examples",
        items: [
          { text: "Overlay chart", link: "/examples/" },
          { text: "Oscillator chart", link: "/examples/indicators" },
          { text: "Multiple charts", link: "/examples/multiple" },
          { text: "Custom data", link: "/examples/custom-data" }
        ]
      }
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/facioquo/stock-charts" }]
  }
});
