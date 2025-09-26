# InsightPrep: AI Coding Agent Instructions

## Project Overview
InsightPrep is a browser-based exam and learning platform for question banks. It supports both interactive practice and timed exam simulation. The architecture is modular, with strict boundaries between UI, state management, and exam logic. Core files must not be restructured without explicit consent.

## Architecture & Data Flow
- **mocktest.html**: Main entry for database selection, filter options, and launching tests.
- **exam.html**: Dedicated exam mode interface. Navigation to this page is required for exam simulation.
- **database-filter-panel.js**: Builds the filter panel UI, manages topic/type selection, and launches tests.
- **exam-engine.js**: Handles exam mode logic, question navigation, timing, and answer tracking.
- **app-state.js**: Centralized state management for options, user progress, and persistence.
- **test-engine.js**: Learning mode logic (practice, feedback, scoring).

### Navigation Flow
```
Database Selection → Filter Options → Test Mode Selection
                                  ├─ Learning Mode (same page)
                                  └─ Exam Practice → exam.html
```

## Developer Workflows
- **No build step required for core app**; static HTML/JS/CSS. Build tools (see `tools/`, `build_obf/`) are for asset minification/obfuscation only.
- **Testing**: Manual, via browser. No automated test suite present.
- **Debugging**: Use browser dev tools. Console logs are discouraged in production code.
- **State**: Use `AppState` for all persistent options and runtime data. Do not introduce new global variables.

## Project-Specific Conventions
- **Do not change core file structure or navigation flow without explicit owner consent.**
- **All UI changes must preserve the separation between filter panel, exam logic, and state.**
- **Exam mode must always use `exam.html` and `exam-engine.js`.**
- **Learning mode runs in the main page using `test-engine.js`.**
- **Cookies/localStorage**: Used for examinee name and persistent options.
- **Golden/**: Contains snapshot folders for reference implementations. Do not modify.
- **DB Files/**: SQLite databases for questions. Do not commit changes to these files.

## Integration Points
- **No external API calls.** All data is local (DB/JSON).
- **Build tools**: Only used for asset minification/obfuscation. See `tools/` and `build_obf/`.
- **Logo and branding**: Use assets from `Logos/`.

## Examples
- To add a new filter option, update only `database-filter-panel.js` and preserve the UI structure.
- To change exam logic, modify `exam-engine.js` but do not alter navigation or state boundaries.
- To persist new user options, use `app-state.js` and localStorage/cookies as shown in existing code.

## Key Directories
- `Golden/`: Reference snapshots. Never edit.
- `DB Files/`, `DB Schema/`: Question databases and schema. Read-only.
- `Documentation/`: Project documentation.
- `Insert Rules/`: Rules for question insertion.

---
**Always ask before making structural changes.**
