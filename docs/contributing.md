# Contributing guidelines

Thanks for taking the time to contribute!

Before contributing, please be aware that we are accepting these sorts of changes:

- Bug reports and fixes
- Demonstrations of other `Skender.Stock.Indicators` NuGet package features

## Reporting bugs

If you are reporting a bug, please submit an Issue with a detailed description of the problem. Be sure to include steps to reproduce, code samples, and any reference materials.

## Development setup

For complete development setup instructions, see the [main README.md](../README.md#development-setup).

### Quick start for contributors

1. **Clone and setup** (see [Development Setup](../README.md#development-setup) for details):

   ```bash
   git clone https://github.com/facioquo/stock-charts.git
   cd stock-charts
   npm install
   ```

2. **Start full development environment**:

   ```bash
   # Use VS Code Task (recommended)
   # Ctrl+Shift+P → "Tasks: Run Task" → "start-full-stack"
   ```

   This starts all services: Azure Storage emulator, Azure Functions, Web API, and Angular dev server.

3. **Development workflow**:
   - Make your changes
   - Run linting: `npm run lint:fix`
   - Run formatting: `npm run format`
   - Test your changes: `npm run test:all`
   - Ensure builds pass: `dotnet build Charts.sln`

For detailed information about:

- [Project structure and scripts](../README.md#project-structure)
- [VS Code development setup](../README.md#vs-code-development)
- [Code formatting and quality](../README.md#code-formatting-and-quality)
- [Environment configuration](../README.md#environment-configuration)

## Code quality requirements

This project maintains high standards for code quality:

- ✅ All linting must pass (`npm run lint`)
- ✅ Code must be properly formatted (`npm run format`)
- ✅ .NET solution must build (`dotnet build Charts.sln`)
- ✅ All tests must pass (`npm run test:all`)
- ✅ No suppression of linting errors without team review

See [Code Quality section](../README.md#code-quality-and-verification) in the main README for current status.

## Development guidelines

- Read this first: [contributing to an open-source GitHub project](https://codeburst.io/a-step-by-step-guide-to-making-your-first-github-contribution-5302260a2940)
- Do not comingle multiple contributions. Please keep changes small and separate.
- Since this is a demo project, we want it to pass the build and run without errors.
- Failed builds will block acceptance of your Pull Request.

## Submitting changes

Submit a Pull Request with a clear list of what you've done (read more about [pull requests](http://help.github.com/pull-requests/)).

After a Pull Request is reviewed, accepted, and merged to `main`, we may batch changes before publishing the site. Please be patient with turnaround time.

## Contact us

Contact us through the NuGet [Contact Owners](https://www.nuget.org/packages/Skender.Stock.Indicators) method, privately direct message [@daveskender](https://twitter.com/messages/compose?recipient_id=27475431) on Twitter, or [submit an Issue](https://github.com/facioquo/stock-charts/issues) with your question if it is publicly relevant.

Thanks,
Dave Skender

---

Last updated: August 15, 2025
