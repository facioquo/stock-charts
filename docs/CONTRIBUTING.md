# Contributing guidelines

Thanks for taking the time to contribute!

Before contributing, please be aware that we are accepting these sorts of changes:

- Bug reports and fixes
- Demonstrations of other `Skender.Stock.Indicators` NuGet package features

## Reporting bugs

If you are reporting a bug, please submit an Issue with a detailed description of the problem.  Be sure to include steps to reproduce, code samples, and any reference materials.

## Developing

- Read this first: [contributing to an open-source GitHub project](https://codeburst.io/a-step-by-step-guide-to-making-your-first-github-contribution-5302260a2940)
- Do not comingle multiple contributions.  Please keep changes small and separate.

## Testing

- Since this is just a simple demo project, we basically just want it to pass the build and run without errors.
- Failed builds will block acceptance of your Pull Request when submitting changes.

### Building and Testing

#### Backend (.NET)

To build the backend API:

```bash
# Navigate to the server directory
cd server

# Restore dependencies
dotnet restore

# Build the solution
dotnet build ChartBackend.sln --configuration Release

# Run tests (if any)
dotnet test
```

#### Frontend (Angular)

To build the Angular client:

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Development build
npm run build

# Production build
npm run build.prod

# Start development server
npm start

# Watch mode (rebuild on changes)
npm run watch
```

## Submitting changes

Submit a Pull Request with a clear list of what you've done (read more about [pull requests](http://help.github.com/pull-requests/)).

After a Pull Request is reviewed, accepted, and merged to `main`, we may batch changes before publishing the site.  Please be patient with turnaround time.

## Contact us

Contact us through the NuGet [Contact Owners](https://www.nuget.org/packages/Skender.Stock.Indicators) method, privately direct message [@daveskender](https://twitter.com/messages/compose?recipient_id=27475431) on Twitter, or [submit an Issue](https://github.com/facioquo/stock-charts/issues) with your question if it is publicly relevant.

Thanks,
Dave Skender
