# Hugo

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Implementation choice for the authorised first version: Node.js local server with ical.js for optional calendar imports, HTML/CSS/JavaScript UI, Python text extraction with installed pypdf. No deployment or cloud backend.

## Users
Sascha, a Swiss primary school teacher preparing the current teaching week on a Mac.

## Product Purpose
Speak or type a request, find information in explicitly selected folders and receive a source-grounded written and spoken answer.

## Operating Context
Chrome on macOS. Google Drive and OneDrive are synced in Finder. Existing Claude subscription; independent Claude jobs are acceptable. Claude Code is installed. Local helper is authorised.

## Capabilities and Constraints
- Select folders individually; read-only access to source files.
- Claude subscription authentication through the installed CLI; no API-key billing fallback.
- Wake phrase while page is open, including background tabs, subject to browser/device limitations; visible microphone control.
- German text and speech. Current week means Monday to Sunday in Europe/Zurich.
- Normal chat works without folders and without reading files. Explicit document mode includes selected-folder text; empty document results no longer block conversational responses. Browser/System voice selection has a preview and local preference persistence.
- Natural voice without additional charges: use installed high-quality German macOS voices through public AVFoundation APIs and local temporary WAV audio. Browser voices remain selectable. No cloning or import of Claude's voice. Sentence-aware speech segmentation and slightly calmer pace.
- KlassenFLOW and LearningView: read-only imports of visible browser views; optional Chrome bridge prepared. Private Google calendar embed and location-based weather widgets. Cowork-session control deferred.
- Folder contents are sent to Claude only when running a request. Do not invent missing sources or completeness.
- First version reads text, Markdown, PDF, DOCX and RTF; scans and cloud-only native documents may require export/OCR later.

## Product Principles
- Evidence before claims; show sources and coverage limits.
- File access is an explicit selection and can be revoked.
- No source modifications and no arbitrary tools for Claude.
- A usable text path remains available when speech fails.

## Brand Commitments
Name: Hugo. Two user-requested appearances are selectable: the existing dark, luminous, animated futuristic assistant and a school chalkboard with Post-it widgets and a talking board sponge. Futuristic remains the default. The earlier warm reading-room direction was rejected; it is not the chalkboard theme.
