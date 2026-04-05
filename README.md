# Kaalaman

<div align="center">
  <p><strong>Context-aware AI study companion for bilingual, document-driven learning workflows.</strong></p>
  <p>Built with Next.js 16, React 19, TypeScript, OpenAI, PDF/DOCX parsing, speech interfaces, and a local Lite Mode fallback.</p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/Jetsetter123/kaalam/ci.yml?branch=main&style=for-the-badge&label=CI" alt="CI status" />
    <img src="https://img.shields.io/github/v/release/Jetsetter123/kaalam?style=for-the-badge&label=Release" alt="GitHub release" />
    <img src="https://img.shields.io/github/package-json/v/Jetsetter123/kaalam?style=for-the-badge&label=Package" alt="Package version" />
    <img src="https://img.shields.io/github/license/Jetsetter123/kaalam?style=for-the-badge" alt="License" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2.2-111111?style=flat-square&logo=nextdotjs" alt="Next.js 16.2.2" />
    <img src="https://img.shields.io/badge/React-19.2.4-149ECA?style=flat-square&logo=react" alt="React 19.2.4" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript 5" />
    <img src="https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai" alt="OpenAI API" />
    <img src="https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  </p>
</div>

## Overview

Kaalaman is an experimental AI-powered study system designed around a context-first interaction model: users upload academic materials, the application extracts and normalizes text from those sources, and the resulting context is routed into either an AI-assisted inference path or a local heuristic fallback path depending on runtime mode. The project is optimized for student-facing workflows such as summarization, explanation, quiz generation, translation, and bilingual chat in English and Tagalog, while also serving as a full-stack exploration of prompt orchestration, document ingestion, multimodal interaction, and resilient application design.

## System Snapshot

| Layer | Responsibilities | Current Implementation |
| --- | --- | --- |
| Presentation | Chat UI, file upload, quick actions, voice controls, local persistence | Next.js App Router, React 19, Tailwind CSS |
| Application | Mode routing, client state, Lite Mode generation, notification flow | TypeScript client logic |
| Ingestion | File validation, parsing, normalization, truncation | `pdf-parse`, `mammoth`, text preprocessing |
| Inference | Context-aware study responses | OpenAI chat completions with mode-specific instructions |
| Resilience | Offline-friendly fallback and graceful degradation | Local Lite Mode summary, quiz, explain, translate logic |

## Architecture

```text
Student User
  -> Next.js Client Interface
     -> /api/upload
        -> PDF / DOCX / TXT / MD extraction
        -> normalization and truncation
        -> study context
     -> /api/chat
        -> mode instruction router
        -> prompt assembly + uploaded context
        -> OpenAI API
        -> AI response
     -> Lite Mode heuristics
        -> local summary / quiz / explanation / translation
     -> speech recognition / speech synthesis
  -> rendered study response
```

## Core Capabilities

| Capability | Description |
| --- | --- |
| Document-aware chat | Accepts uploaded notes and uses them as contextual grounding for responses |
| Multilingual interaction | Supports English and Tagalog study prompts |
| Study-mode routing | Offers general, summary, quiz, explain, and translate flows |
| Lite Mode fallback | Generates local study assistance when API access is unavailable |
| Speech interface | Uses browser speech recognition and speech synthesis for voice-driven interaction |
| Session continuity | Persists messages, mode state, and uploaded context through local storage |

## Runtime Requirements

| Category | Requirement |
| --- | --- |
| Operating system | 64-bit Windows, Linux, or macOS |
| Node.js | `>=20.9.0` |
| npm | Current npm version bundled with Node 20+ |
| Memory | `16 GB` recommended for standard development, `32 GB` recommended for heavier multitasking, large documents, and local build workflows |
| CPU | Modern multi-core processor |
| Storage | SSD recommended |
| Network | Required for OpenAI-backed features |

## Quick Start

```bash
npm install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Model

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables remote AI-powered responses through the OpenAI API |

## API Surface

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/upload` | `POST` | Upload and parse PDF, DOCX, TXT, or Markdown notes |
| `/api/chat` | `POST` | Generate context-aware AI responses based on selected study mode |
| `/api` | `GET` | Base API route |

## Repository Layout

```text
app/
  api/
    chat/route.ts       -> AI chat orchestration
    upload/route.ts     -> document ingestion and parsing
  [slug]/route.ts       -> dynamic route handling
  globals.css           -> global design system styles
  layout.tsx            -> app metadata and root layout
  page.tsx              -> primary study interface
public/
  manifest.json         -> PWA metadata
next.config.ts          -> framework configuration
package.json            -> scripts, metadata, dependency graph
```

## Release Workflow

This repository is set up to look and behave more like a maintained software project:

- A CI pipeline runs linting and production builds on pushes and pull requests to `main`.
- A release workflow is prepared to create GitHub Releases when tags matching `v*` are pushed.
- Package metadata is normalized in `package.json` for repository indexing, version visibility, and release tracking.
- The project is intentionally kept as an application repository rather than an npm-distributed library package.

To create a release later:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Technology Stack

```text
Frontend      : Next.js 16, React 19, Tailwind CSS 4
Language      : TypeScript
AI Layer      : OpenAI API
Parsing Layer : pdf-parse, mammoth
Tooling       : ESLint, npm, GitHub Actions
```

## Notes

- Uploaded notes are truncated for safer prompt sizing and more stable response generation.
- Lite Mode is intentionally simpler than the AI path and serves as a graceful fallback.
- Browser speech features depend on runtime browser support.

## License

MIT
