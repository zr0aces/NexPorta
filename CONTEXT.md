# Domain Context and Glossary

This document outlines the core domain model concepts of NexPorta. It establishes a shared vocabulary for developers and AI agents exploring the codebase.

## Domain Glossary

### Document / Content
Any HTML (.html, .htm) or Markdown (.md, .markdown) file stored inside the designated content directory. These documents are read-only to visitors but can be updated or added via authenticated API uploads.

### Index
The static JSON registry file (`index.json`) that catalogs all available Documents, including path mapping, extracted titles, folders, filenames, and modified timestamps.

### Content Indexer
The pipeline responsible for scanning the content directory, parsing files (extracting titles via regular expressions or YAML front matter), and compiling the static Index registry file.
* See [indexer/builder.js](file:///home/san/workspace/NexPorta/indexer/builder.js)

### Content Storage
The module managing filesystem modifications. It encapsulates path resolution, single-level folder restrictions, extension validation, file size limits, directory creation, and writing streams.
* See [indexer/storage.js](file:///home/san/workspace/NexPorta/indexer/storage.js)

### Document Authenticator
The security module validating admin credentials. It loads verification configs, generates secure random fallbacks, and executes constant-time comparisons.
* See [indexer/authenticator.js](file:///home/san/workspace/NexPorta/indexer/authenticator.js)

### Dashboard Store
The client-side state machine in the browser. It manages local storage caching, password expiry sessions, date formatting, and performs search, filtering, and sorting logic.
* See [dashboard/store.js](file:///home/san/workspace/NexPorta/dashboard/store.js)
