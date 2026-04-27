import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Indy Charts Demo",
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
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/guide/" },
          { text: "Installation", link: "/guide/installation" },
          { text: "Quick Start", link: "/guide/quick-start" }
        ]
      },
      {
        text: "Examples",
        items: [
          { text: "Basic Chart", link: "/examples/" },
          { text: "With Indicators", link: "/examples/indicators" },
          { text: "Multiple Charts", link: "/examples/multiple" }
        ]
      }
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/facioquo/stock-charts" }]
  }
});
