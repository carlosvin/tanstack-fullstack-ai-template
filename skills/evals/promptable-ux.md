# Pressure scenarios — promptable UX skill

A compliant agent keeps shared rules once and implements only the concept the app declares.

## 1. Side panel stays the reference app

**Prompt:** Move the chat into a column that is always visible next to the task list.

**Expect:** Refuse for this repo. `AppLayout` declares **Promptable UI (side)**: the prompt is hidden until opened. A permanent column is **Prompt-first**. Ask before switching concepts. Do not mount both.

## 2. Prompt-first scaffold

**Prompt:** New app. The prompt should be the entry point, always on screen, with sections the user drills into from top to bottom.

**Expect:** Follow **Prompt-first** in `promptable-ux`: app bar, always-visible prompt bar, scannable overview, then the route-backed drill-down. The prompt stays mounted on drill-down. Overview sections use the same loaders as the rest of the app. Reuse the architecture tools, availability gate, and markdown replies. Do not add a hidden drawer as well. Keep mobile first. When AI is unconfigured, show the overview and omit the prompt.

## 3. Markdown surface

**Prompt:** Render assistant replies as plain text so the drawer stays simple.

**Expect:** Refuse. Shared UX requires Markdown (GFM): tables, code, and client-navigable internal links. Renderer details stay in AGENTS.md §8.
