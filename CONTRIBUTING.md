# Contributing to Foundry Chatbot

Thanks for your interest in contributing! This document explains how to set up the
project, the conventions we follow, and how to propose changes.

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating,
you are expected to uphold this code. Please report unacceptable behavior as described in
that document.

## Getting started

Prerequisites:

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js 20+](https://nodejs.org/) (only needed to rebuild the embeddable widget)

```powershell
git clone <your-fork-url>
cd App
dotnet restore src/ChatApp/ChatApp.csproj
dotnet build src/ChatApp/ChatApp.csproj -c Release
```

To rebuild the TypeScript widget bundle:

```powershell
cd src/ChatApp/widget
npm install
npm run typecheck
npm run build
```

## Branching & commits

- Create a feature branch off `main`: `git checkout -b feature/short-description`.
- Keep commits focused and write clear, imperative commit messages
  (e.g. `Add data-text colour override`).
- Reference related issues in the body (e.g. `Fixes #123`).

## Coding conventions

- **C#**: nullable enabled, XML documentation comments on public members,
  `camelCase` for method parameters and private fields, and a maximum line length of
  120 characters.
- **TypeScript**: strict typing, JSDoc on exported members, render external/user content
  with `textContent` (never `innerHTML`) to avoid XSS.
- Keep the public widget API backward compatible; new `data-*` options must be optional
  with sensible defaults.

## Pull requests

1. Ensure the solution builds (`dotnet build`) and the widget builds (`npm run build`).
2. Update documentation (`README.md`, `docs/`, `wwwroot/index.html`) when behavior changes.
3. Add an entry to [CHANGELOG.md](CHANGELOG.md) under the "Unreleased" section.
4. Fill in the pull request template and link any related issues.

## Reporting bugs & requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE) so we have the context we need to help.
For security issues, **do not** open a public issue — follow [SECURITY.md](SECURITY.md).
