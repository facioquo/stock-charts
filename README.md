# Stock Indicators for .NET demo

This is a demo of the [Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators) NuGet package.  It is an Angular website with a [Chart.js](https://github.com/chartjs/chartjs-chart-financial) financial/candlestick stock chart, with a .NET Web API backend to generate indicators.  The indicator library can be implemented in any .NET compatible ecosystem (it does not have to be in an API like this).  See the [library documentation](https://dotnet.stockindicators.dev) for [more examples](https://dotnet.stockindicators.dev/examples), the user guide, and a full list of available indicators.

Live demo site: [charts.StockIndicators.dev](https://charts.stockindicators.dev/)

![image](https://raw.githubusercontent.com/DaveSkender/Stock.Indicators/main/docs/examples.webp)

## Author's note

This repo and charting tool is primarily intended to demonstrate the [Stock Indicators for .NET](https://dotnet.stockindicators.dev) library.  **It is not meant to be a fully featured charting system** and may not be an architectural model that works for your use case.  If you need a mature charting tool, please explore all of your [charting and visualization options](https://github.com/DaveSkender/Stock.Indicators/discussions/430).

## Running this demo locally

If you want to host on your local computer and review the source code, follow the instructions below.

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/)
- [Visual Studio](http://visualstudio.com)

### Steps

1. [Clone the repo](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository)

2. Open `\Server\ChartBackend.sln` in Visual Studio.  Take note of the URL in the WebApi project properties.

    ![WebApi Properties ><](Client/src/assets/server-port.png)

3. Select `WebApi` project and run by either `CTRL+F5` or `dotnet run` CLI command.  You can also View from right-click menus.  If you've done this successfully, a browser window will open and say "API is functioning nominally."  Leave the browser window open.

4. Open `Client\src\environments\environment.ts` and modify the API URL, if needed, then save file.

    ```ts
    export const env: EnvConfig = {
      production: false,
      api: 'https://localhost:44392'
    };
    ```

5. Open `Git Bash` window and navigate to the `\Client` folder

    ``` bash
    npm install
    npm start
    ```

    The web application should launch automatically.

### Fetching quote data

Optionally, if you intend to use the local Azure storage emulator to get and store local quote data from the Alpaca API, you'll also need to set some local environment variables and run the ‘Functions.csproj‘ project.  Use your own key and secret values.

``` bash
setx ALPACA_KEY "YOUR ALPACA API KEY"
setx ALPACA_SECRET "YOUR ALPACA SECRET KEY"
setx AzureWebJobsStorage "UseDevelopmentStorage=true"
```

## Contributing

This is an open-source project.  If you want to report bugs, contribute fixes, or add new indicators, please review our [contributing guidelines](docs/CONTRIBUTING.md).
