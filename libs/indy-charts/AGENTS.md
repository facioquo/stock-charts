# Indicator charts (indy-charts)

This Chart.js chart component is a standalone reusable library for use in generating simple depictions of indicators in documentation sites. In this repository, it must only depend on the [`@facioquo/chartjs-chart-financial`](../chartjs-financial/) package and no other elements in this workspace.

> Indirectly, this component does rely on the [REST API](../../server/) through configuration only.

Project dependencies are strictly in this direction only: indy-charts → chartjs-financial

Its integration is confirmed and depicted in our [test VitePress website](../../tests/vitepress).

This library is published privately to GitHub Packages for our organization and will never be published to public registries.
