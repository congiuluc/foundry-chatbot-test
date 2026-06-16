# Security Policy

## Supported Versions

Security fixes are applied to the latest release on the `main` branch. Please make sure you
are running the most recent version before reporting an issue.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately using one of the following channels:

- Use GitHub's [private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
  ("Report a vulnerability" under the **Security** tab), or
- Email the maintainers at **security@allitude.example** with the details.

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce or a proof of concept
- Affected version(s) and environment

We aim to acknowledge reports within 3 business days and to provide a remediation timeline
after triage. Please give us a reasonable opportunity to address the issue before any public
disclosure.

## Handling Secrets

This project authenticates to Azure using managed identity by default; API keys are only used
when explicitly configured. Never commit secrets (API keys, connection strings) to the
repository — use environment variables or a secret store. The embeddable widget never exposes
backend credentials to the browser.
