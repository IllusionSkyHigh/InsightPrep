# InsightPrep Project Guidelines

## Architecture Principles

### Core File Structure (DO NOT CHANGE WITHOUT CONSENT)
- **mocktest.html** - Main page for database selection and filter options
- **exam.html** - Dedicated exam practice mode interface
- **exam-engine.js** - Exam functionality and logic
- **database-filter-panel.js** - Filter panel and test mode selection
- **app-state.js** - Application state management

### Navigation Flow (PRESERVE)
```
Database Selection → Filter Options → Test Mode Selection
                                  ├─ Learning Mode (same page)
                                  └─ Exam Practice → exam.html
```

## Development Rules

### 🚨 CRITICAL - Require Explicit Consent Before:
1. **Changing core file architecture** (adding/removing main files)
2. **Modifying navigation flow** between pages
3. **Eliminating or merging major components** (exam.html, mocktest.html)
4. **Restructuring state management** systems
5. **Major refactoring** of working functionality

### ✅ Safe Changes (No Consent Needed):
- Bug fixes within existing functions
- UI styling improvements
- Adding new features without changing core structure
- Performance optimizations
- Code comments and documentation

### 📝 Always Ask First:
"Should I modify the core architecture?" before any structural changes.

## Current Issues to Resolve
- Browser "Leave site?" dialog in exam mode navigation
- Maintain exam.html as primary exam interface
- Preserve all existing functionality

---
**Remember: Evolution, not revolution. Improve what exists rather than rebuilding.**