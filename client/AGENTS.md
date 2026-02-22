# Indicators demonstration website

The indicators demonstration website provides users of the Skender.Stock.Indicators NuGet library a way to visualize and see the library in action.

This website depends on [`@facioquo/indy-charts`](../libs/indy-charts/) and indirectly on the [REST API](../server/).  It must not directly depend on `@facioquo/chartjs-chart-financial`.

Project dependencies are strictly in this direction only: client → indy-charts → chartjs-financial
