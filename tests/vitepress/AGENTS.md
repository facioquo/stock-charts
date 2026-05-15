# VitePress demo and integration test host for indy-charts

This VitePress website serves two purposes:

1. **Consumer documentation**: demonstrates `@facioquo/indy-charts` in a realistic deployment scenario — the kind of site a library adopter would build
2. **Integration test host**: Playwright tests run against it to verify the public API works correctly end-to-end

It is deployed publicly on Cloudflare Pages (`stock-charts-vitepress`).

## Rules

- **Dependencies**: depends only on `@facioquo/indy-charts` (and indirectly on the REST API). Must not directly depend on `@facioquo/chartjs-chart-financial` or any aspects of the primary client website.
- **Heading style**: use sentence case for all headings.
- **No internal repo references**: documentation pages must not include VS Code task names, local port numbers, or other details specific to this repository's development environment.

## VitePress version

`vitepress` is pinned to `2.0.0-alpha.16` (a pre-release) intentionally: we are tracking VitePress 2.x to evaluate its updated plugin and theme APIs before the stable release. Downgrade to `1.x` only if the alpha blocks CI or produces breaking changes. Review when a stable `2.x` is published.
