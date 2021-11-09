# Stock Indicators for .NET NuGet package Demo

[![Build status](https://dev.azure.com/skender/Stock.Indicators/_apis/build/status/Stock.Charts)](https://dev.azure.com/skender/Stock.Indicators/_build/latest?definitionId=23)

This is a demo for use of the [Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators) NuGet package.  It is an Angular website with a .NET Web API that auto generates a stock chart.  You can add and remove indicators on the fly, to the chart.  Only a few sample indicators are shown in this demo.  See the [Library documentation](https://daveskender.github.io/Stock.Indicators) for more information and a full list of available indicators.

DEMO: [https://stock-charts.azurewebsites.net](https://stock-charts.azurewebsites.net/) is the Azure hosted live site of this demonstration.  Please note this is hosted on a "cost effective" Azure service plan, so you can attribute slowness to this low-end host.  The package itself is quite fast.

If you want to host yourself on your local computer and review the source code, follow the instructions below.

## Running the demo locally

### Prerequisites

- [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) v12.x or later
- [Visual Studio 2019](http://visualstudio.com)

### Steps

1. [Clone the repo](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository)

2. Open `\Server\Backend.sln` in Visual Studio

3. Select `WebApi` project and Run by either `CTRL+F5` or `CTRL+SHIFT+W`.  You can also View from right-click menus.  If you've done this successfully, a browser window will open and say "API is functioning nominally."  Leave the browser window open.  Take note of the URL in your browser, or from the Debug menu in WebApi project properties.

    ![WebApi Properties ><](Client/src/assets/server-port.png)

4. Open `Client\src\environments\environment.ts` and modify the API URL if needed, then save file.

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

## Troubleshooting

If the [Server] Web API does not launch, right-click the Solution and "Restore NuGet Packages"; then, try to Rebuild the entire Solution in Visual Studio.  Make sure the WebApi project is highlighted (bold font), then try `CTRL+F5` again.

If the [Client] website does not launch, check to make sure you have a recent version of Git and Node installed and try the above commands again.  You might also try `npm install -g npm@latest` in the bash window to update NPM to a newer version.

## Contributing

This is an open-source project.  If you want to report or contribute bug fixes or add new indicators, please review our [contributing guidelines](CONTRIBUTING.md).
