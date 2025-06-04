# Contributing guidelines

Thanks for taking the time to contribute!

Before contributing, please be aware that we are accepting these sorts of changes:

- Bug reports and fixes
- Demonstrations of other `Skender.Stock.Indicators` NuGet package features

## Development Branch and Workflow

- **Primary development branch**: `main`
- All development work should be based on the latest `main` branch
- Create feature branches from `main` for your contributions
- Pull requests should target the `main` branch

## Branch Naming Conventions

When creating branches, please use one of these prefixes:

- `feature/` - for new features (e.g., `feature/add-rsi-indicator`)
- `fix/` - for bug fixes (e.g., `fix/chart-rendering-issue`)
- `docs/` - for documentation updates (e.g., `docs/update-setup-guide`)
- `chore/` - for maintenance tasks (e.g., `chore/update-dependencies`)
- `refactor/` - for code refactoring (e.g., `refactor/api-endpoints`)

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

Examples:
feat: add RSI indicator to chart options
fix: resolve WebSocket connection timeout
docs: update installation instructions
chore: update npm dependencies
refactor: restructure API service layer
```

**Types:**
- `feat` - new features
- `fix` - bug fixes
- `docs` - documentation changes
- `chore` - maintenance tasks
- `refactor` - code refactoring
- `test` - adding/updating tests
- `ci` - CI/CD changes
- `perf` - performance improvements
- `style` - code style changes

## Reporting bugs

If you are reporting a bug, please submit an Issue with a detailed description of the problem.  Be sure to include steps to reproduce, code samples, and any reference materials.

## Developing

- Read this first: [contributing to an open-source GitHub project](https://codeburst.io/a-step-by-step-guide-to-making-your-first-github-contribution-5302260a2940)
- Do not comingle multiple contributions.  Please keep changes small and separate.

## Testing

- Since this is just a simple demo project, we basically just want it to pass the build and run without errors.
- Failed builds will block acceptance of your Pull Request when submitting changes.

## Issue and Pull Request Labels

We use labels to organize and prioritize issues and pull requests:

### Issue Types
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `question` - Further information is requested
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed

### Priority Levels
- `priority: critical` - Needs immediate attention
- `priority: high` - Important, should be addressed soon
- `priority: medium` - Moderate importance
- `priority: low` - Nice to have

### Component Labels
- `frontend` - Angular client-side changes
- `backend` - .NET API changes
- `ci/cd` - Build and deployment changes
- `dependencies` - Dependency updates

### Status Labels
- `needs-triage` - Needs initial review
- `ready-for-dev` - Ready for development
- `in-progress` - Currently being worked on
- `needs-review` - Ready for code review
- `blocked` - Cannot proceed due to dependencies

## Dependency Updates

We use Dependabot to automatically create pull requests for dependency updates:

- **Automatic PRs**: Dependabot creates PRs weekly for minor and patch updates
- **Review Process**: All dependency PRs should be reviewed for breaking changes
- **Major Updates**: Major version updates are ignored and require manual review
- **Testing**: Always test dependency updates locally before merging
- **Labels**: Dependency PRs are automatically labeled with `dependencies`

### Handling Dependency PRs

1. Review the changelog/release notes for the updated package
2. Check for any breaking changes
3. Test the application locally with the updates
4. Approve and merge if no issues are found
5. Create an issue if the update causes problems

## Project Boards and Workflow

We use GitHub Projects to track progress:

- **Backlog**: New issues and feature requests awaiting triage
- **Ready**: Issues that are ready for development
- **In Progress**: Issues currently being worked on
- **Review**: Pull requests awaiting review
- **Done**: Completed items

## Access and Permissions

### Repository Access
- **Read Access**: Anyone can view the repository and submit issues
- **Write Access**: Contributors with proven track record
- **Admin Access**: Core maintainers only

### GitHub Copilot Agent Access
- Copilot agents can read repository contents and issues
- Agents can suggest code changes through pull requests
- All agent-generated PRs require human review before merging

### Requesting Permissions

To request additional permissions:

1. Open an issue with the "access-request" label
2. Describe your intended contributions
3. Provide examples of previous contributions (if any)
4. Maintainers will review and respond within a week

## Submitting Changes

Submit a Pull Request with a clear list of what you've done (read more about [pull requests](http://help.github.com/pull-requests/)).

### Pull Request Process

1. **Create Branch**: Create a feature branch from `main`
2. **Make Changes**: Implement your changes following coding standards
3. **Test Locally**: Ensure all builds pass and functionality works
4. **Update Documentation**: Update relevant documentation
5. **Submit PR**: Create a pull request using the provided template
6. **Code Review**: Respond to feedback and make requested changes
7. **Merge**: Maintainers will merge approved PRs

### Pull Request Requirements

- [ ] PR title follows conventional commit format
- [ ] Description clearly explains the changes
- [ ] All builds pass successfully
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No merge conflicts with `main`

After a Pull Request is reviewed, accepted, and merged to `main`, we may batch changes before publishing the site. Please be patient with turnaround time.

## GitHub Copilot Coding Agent Optimization

This repository is optimized for GitHub Copilot Coding Agent usage. Here are the key practices we follow:

### For Human Contributors
- **Clear Issue Descriptions**: Use detailed issue templates with reproduction steps, expected vs actual behavior, and relevant context
- **Structured Pull Requests**: Follow the PR template with clear descriptions, testing notes, and linked issues
- **Conventional Commits**: Use standardized commit messages for better AI understanding
- **Documentation First**: Keep README and CONTRIBUTING.md current and comprehensive

### For AI Agents
- **Context-Rich Documentation**: All setup, build, and test instructions are in README.md
- **Standardized Templates**: Issue and PR templates provide structured input formats
- **Clear Branching Strategy**: Main development branch and naming conventions are documented
- **Automated Workflows**: CI/CD pipelines provide immediate feedback

### Repository Structure for AI Understanding
```
├── .github/                 # GitHub configuration
│   ├── ISSUE_TEMPLATE/     # Structured issue templates
│   ├── workflows/          # CI/CD automation
│   └── dependabot.yml      # Dependency management
├── client/                 # Angular frontend
├── server/                 # .NET backend
├── docs/                   # Additional documentation
└── README.md              # Primary project documentation
```

### Best Practices for AI-Generated PRs
1. Always reference specific issues or requirements
2. Include test coverage for new functionality
3. Follow existing code patterns and architecture
4. Update documentation for user-facing changes
5. Ensure all CI checks pass before requesting review

## Contact us

Contact us through the NuGet [Contact Owners](https://www.nuget.org/packages/Skender.Stock.Indicators) method, privately direct message [@daveskender](https://twitter.com/messages/compose?recipient_id=27475431) on Twitter, or [submit an Issue](https://github.com/facioquo/stock-charts/issues) with your question if it is publicly relevant.

Thanks,
Dave Skender
