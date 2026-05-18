import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Indy Charts",
  description: "Financial charting with @facioquo/indy-charts",
  appearance: "dark",

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
          { text: "Basic chart", link: "/examples/" },
          { text: "With indicators", link: "/examples/indicators" },
          { text: "Multiple charts", link: "/examples/multiple" },
          { text: "Custom data", link: "/examples/custom-data" }
        ]
      }
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/facioquo/stock-charts" }]
  }
});
