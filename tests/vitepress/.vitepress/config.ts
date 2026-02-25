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
        ),
        // Pin date-fns to the version installed in this package's node_modules.
        // chartjs-adapter-date-fns@3.0.0 declares date-fns@^2 as its peer dep
        // so pnpm may resolve a different (older) virtual-store instance;
        // the explicit alias ensures both the adapter and any other
        // importers share the same date-fns@3 installed here.
        "date-fns": fileURLToPath(
          new URL("../node_modules/date-fns", import.meta.url)
        )
      }
    },
    ssr: {
      // Prevent SSR externalisation of these packages so Vite can resolve their
      // peer-dep imports (e.g. date-fns) through the pnpm virtual store.
      noExternal: ["chartjs-adapter-date-fns", "chart.js", "date-fns"]
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
