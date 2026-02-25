import DefaultTheme from "vitepress/theme";

import "./custom.css";
import IndyIndicatorsDemo from "./components/IndyIndicatorsDemo.vue";
import IndyOverlayDemo from "./components/IndyOverlayDemo.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("IndyOverlayDemo", IndyOverlayDemo);
    app.component("IndyIndicatorsDemo", IndyIndicatorsDemo);
  }
};
