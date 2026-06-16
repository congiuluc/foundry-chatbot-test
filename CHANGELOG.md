# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Built-in light / dark / system theme toggle for the widget, available both as a header
  icon button and as a System/Light/Dark selector in the settings panel; the preference is
  persisted per session.
- Theme toggle (sun/moon icon button) on the landing/demo page, persisted to local storage
  and defaulting to the operating-system colour scheme.
- Client-side widget theming via `data-panel`, `data-user-bubble`, `data-bot-bubble` and
  `data-text` attributes, with safe CSS colour validation.
- Custom launcher icon support via `data-icon`.
- GitHub Pages documentation site under `docs/`.
- Release workflow (`.github/workflows/release.yml`) that builds and publishes the
  container image to Docker Hub and creates a GitHub release on `v*.*.*` tags, with
  `dev`, `prerelease` and `latest` channel tagging.
- Open-source project files: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, issue/PR templates, CI workflow and Dependabot configuration.

### Changed

- Extracted the minimal API endpoints (`/healthz`, `/chat`, `/settings`) and the
  Server-Sent Events streaming helper into a dedicated `ChatApp.Endpoints.ChatEndpoints`
  class, keeping `Program.cs` focused on application startup.
- CI workflow now runs only when files under `src/**` change.
- Smoother streaming responses using a typewriter-style reveal of persistent DOM nodes.
- Improved favicon using the widget's brand glyph.

## [1.0.0] - 2026-06-16

### Added

- Initial release: .NET 10 ChatApp backend (model and agent modes), Server-Sent Events
  streaming, and the embeddable TypeScript chatbot widget.
