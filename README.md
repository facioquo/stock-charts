# Stock Indicators for .NET demo

[![Build status](https://dev.azure.com/skender/Stock.Indicators/_apis/build/status/Stock.Charts)](https://dev.azure.com/skender/Stock.Indicators/_build/latest?definitionId=23)

This is a demo of the [Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators) NuGet package.  It is an Angular website with a [Chart.js](https://github.com/chartjs/chartjs-chart-financial) financial/candlestick stock chart, with a .NET Web API backend to generate indicators.  The indicator library can be implemented in any .NET compatible ecosystem (it does not have to be in an API like this).  See the [library documentation](https://dotnet.stockindicators.dev) for more information and a full list of available indicators.

Live demo site: [charts.StockIndicators.dev](https://charts.stockindicators.dev/)

![image](https://raw.githubusercontent.com/DaveSkender/Stock.Indicators/main/docs/examples.webp)

## Author's note

This repo and charting tool is primarily intended to demonstrate the [Stock Indicators for .NET](https://dotnet.stockindicators.dev) library.  **It is not meant to be a fully featured charting system** and may not be an architectural model that works for your use case.  If you need a mature charting tool, please explore all of your [charting and visualization options](https://github.com/DaveSkender/Stock.Indicators/discussions/430).

## Running this demo locally

If you want to host on your local computer and review the source code, follow the instructions below.

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) v14.x or later
- [Visual Studio](http://visualstudio.com)

### Steps

1. [Clone the repo](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository)

2. Open `\Server\Backend.sln` in Visual Studio

3. Select `WebApi` project and Run by either `CTRL+F5` or `CTRL+SHIFT+W`.  You can also View from right-click menus.  If you've done this successfully, a browser window will open and say "API is functioning nominally."  Leave the browser window open.  Take note of the URL in your browser, or from the Debug menu in WebApi project properties.

    ![WebApi Properties ><](Client/src/assets/server-port.png)

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

### Azurite Storage Emulator

If you intend to use the local Azure storage emulator to get and store local quote Blob data, you'll need to set some local Environment variables.  Use your own key and secret values.

``` bash
setx AlpacaApiKey "ALPACA_API_KEY"
setx AlpacaSecret "ALPACA_SECRET"
setx AzureWebJobsStorage "UseDevelopmentStorage=true"
```

## Troubleshooting

If the [Server] Web API does not launch, right-click the Solution and "Restore NuGet Packages"; then, try to Rebuild the entire Solution in Visual Studio.  Make sure the WebApi project is highlighted (bold font), then try `CTRL+F5` again.

If the [Client] website does not launch, check to make sure you have a recent version of Git and Node installed and try the above commands again.  You might also try `npm install -g npm@latest` in the bash window to update NPM to a newer version.

## Contributing

This is an open-source project.  If you want to report or contribute bug fixes or add new indicators, please review our [contributing guidelines](docs/CONTRIBUTING.md).
