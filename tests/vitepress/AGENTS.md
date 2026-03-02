# Integration test host for indy-charts

This VitePress website is solely for the purpose of testing an actual implementation of the `@facioquo/indy-charts` library package to depict per-use charts in a realistic scenario.

It solely depends on the [`@facioquo/indy-charts`](https://github.com/facioquo/stock-charts/tree/main/libs/indy-charts) package and indirectly on the [REST API](https://github.com/facioquo/stock-charts/tree/main/server).  It must not directly depend on `@facioquo/chartjs-chart-financial` or any aspects of our primary client website.

## Dependencies note

`vitepress` is pinned to `2.0.0-alpha.16` (a pre-release) intentionally: we are tracking VitePress 2.x to evaluate its updated plugin and theme APIs before the stable release. Downgrade to `1.x` only if the alpha blocks CI or produces breaking changes. Review when a stable `2.x` is published.
