import { fileURLToPath, URL } from "url";

import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Indy Charts Demo",
  description: "Financial charting with @facioquo/indy-charts",

  vite: {
    resolve: {
      // Resolve workspace packages from their TypeScript source so they can be
      // bundled directly without requiring a pre-built dist/ (e.g. in CI).
      alias: {
        "@facioquo/chartjs-chart-financial": fileURLToPath(
          new URL("../../../libs/chartjs-financial/index.ts", import.meta.url)
        ),
        "@facioquo/indy-charts": fileURLToPath(
          new URL("../../../libs/indy-charts/index.ts", import.meta.url)
        )
      }
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
