# Coding Standards

## General

- **Simplicity**: Prefer simple, explicit code over clever or dynamic solutions.
- **Function Size**: Keep functions focused and under 100 lines of code.
- **No Heavy Dependencies**: Before adding any npm dependency, evaluate if it is strictly necessary (e.g. built-in Node.js modules).
- **ES Modules**: All JavaScript code in this repository uses ES Modules (`import`/`export`).

## Backend (Indexer)

- **Vanilla Node**: Keep the indexer simple. Use built-in APIs (`fs/promises`, `path`, `crypto`, etc.) where possible.
- **Structured Logging**: Log errors and progress with clean console output containing structured info. Never log personal data, tokens, or paths outside the designated workspace.
- **Regex Extraction**: Use targeted, well-documented regular expressions for fast title extraction. Avoid full HTML parsers.

## Frontend (Dashboard)

- **Vanilla JS**: No compiler step, TypeScript, or frontend framework. Implement pages using standard HTML, CSS, and pure JS.
- **Clean Structure**: Use clear utility functions for client-side sorting, filtering, and folder grouping.
- **Styling**: Maintain vanilla CSS conventions. Clean class-based styling rules should be defined in styling sheets.

## Testing

- **Node:test**: Write unit tests using the built-in `node:test` runner.
- **Mocking**: Mock external dependencies like filesystem calls if needed, keeping tests robust and fast.
- **Coverage**: Ensure all extraction and parsing code paths have corresponding test coverage.

## Security

- **Path Validation**: Prevent directory traversal attacks by resolving and validating all searched paths.
- **Input Sanitization**: Escape inputs in the dashboard dynamically before mounting strings to prevent XSS.
- **Secrets Management**: Never commit credentials, keys, or active environment configs. Put placeholders in example files only.
