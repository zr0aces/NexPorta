# AI Development Rules

This file provides rules and context to AI agents when modifying code or working in this repository.

## Architecture Guidelines
- **Zero Frameworks/Libraries**: The frontend dashboard MUST remain framework-free (Vanilla JS/HTML/CSS). Do not add React, Svelte, Tailwind CSS build processes, etc.
- **No Database**: All content discovery must be filesystem-driven.
- **Regex Parsing**: Title extraction in [indexer/extractor.js](file:///home/san/workspace/NexPorta/indexer/extractor.js) must use regular expressions, not full HTML parser libraries.

## Development Workflow
- **No Hardcoded Versions**: Always read the version from the [VERSION](file:///home/san/workspace/NexPorta/VERSION) file. Run `node scripts/sync-version.mjs` to synchronize version changes across project files.
- **No Hardcoded Config**: Use environment variables (`process.env.CONTENT_DIR`, etc.) instead of hardcoded paths.
- **Maintain Test Suite**: Update tests alongside code changes. Run tests using `node --test tests/*.test.js` from the [indexer](file:///home/san/workspace/NexPorta/indexer) directory.
- **Update Documentation**: Update relevant documentation under `docs/` whenever project configuration or behavior changes.

## Security Practices
- **Safe Input/File Handling**: Validate all inputs at borders. Do not allow path traversal (e.g. escaping `/content`).
- **No Hardcoded Secrets**: Ensure no sensitive variables are stored in files that are committed (use `.env.example`).
- **Volume Permissions**: The `nodejs` user (UID 1001) owns `/data` in Docker. Re-run `docker compose down -v` to clear volumes if user configuration changes.
