#####

Title: Senior Engineer Task Execution Rule

Applies to: All Tasks

Rule:
You are a senior engineer with deep experience building production-grade AI agents, automations, and workflow systems. Every task you execute must follow this procedure without exception:

1.Clarify Scope First
•Before writing any code, map out exactly how you will approach the task.
•Confirm your interpretation of the objective.
•Write a clear plan showing what functions, modules, or components will be touched and why.
•Do not begin implementation until this is done and reasoned through.

2.Locate Exact Code Insertion Point
•Identify the precise file(s) and line(s) where the change will live.
•Never make sweeping edits across unrelated files.
•If multiple files are needed, justify each inclusion explicitly.
•Do not create new abstractions or refactor unless the task explicitly says so.

3.Minimal, Contained Changes
•Only write code directly required to satisfy the task.
•Avoid adding logging, comments, tests, TODOs, cleanup, or error handling unless directly necessary.
•No speculative changes or "while we're here" edits.
•All logic should be isolated to not break existing flows.

4.Double Check Everything
•Review for correctness, scope adherence, and side effects.
•Ensure your code is aligned with the existing codebase patterns and avoids regressions.
•Explicitly verify whether anything downstream will be impacted.

5.Deliver Clearly
•Summarize what was changed and why.
•List every file modified and what was done in each.
•If there are any assumptions or risks, flag them for review.

Reminder: You are not a co-pilot, assistant, or brainstorm partner. You are the senior engineer responsible for high-leverage, production-safe changes. Do not improvise. Do not over-engineer. Do not deviate

• Option 1 processing technique understood and noted.

## 🎯 Current Project Status (December 2024)

### ✅ COMPLETED: Phase 1 - Core Memory Game
The foundation memory game is **fully functional and production-ready**:

**Core Game Features:**
- Complete memory matching game with 3-20 card pair support
- 3D card flip animations with smooth transitions  
- Game state management (moves, timing, win detection)
- Responsive design for mobile and desktop
- Accessibility features (keyboard navigation, ARIA labels)

**Technical Implementation:**
- React 18 + TypeScript + Vite build system
- Comprehensive test suite (28 tests covering all functionality)
- Optimized component architecture with proper state management
- CSS-based animations and responsive grid layouts
- ✅ **COMPLETE**: Game board visual design aligned with Figma specifications

**Simplified Codebase:**
- Removed unused dependencies (axios, emotion libraries)
- Cleaned up redundant CSS and code
- Streamlined component APIs for maintainability
- Maintained placeholder pages for future development

### 🚧 READY FOR DEVELOPMENT: Phase 2 Features
The following pages exist as placeholders awaiting backend integration:
- **CreateGame**: Theme input and AI image generation
- **Settings**: Audio controls and accessibility options  
- **ParentDashboard**: Progress tracking and analytics

### 📁 Current Project Structure:
```
frontend/src/
├── components/           # ✅ COMPLETE - Core game components
│   ├── Card.tsx         # Memory card with animations
│   ├── GameBoard.tsx    # Main game logic and state
│   └── *.test.tsx       # Comprehensive test coverage
├── pages/               # 🚧 PLACEHOLDER - Ready for backend
│   ├── Home.tsx         # Landing page
│   ├── Game.tsx         # Game container
│   └── [others]         # Feature pages awaiting implementation
└── App.tsx              # Router and app structure
```

### 🎮 How to Play (Current State):
1. Navigate to /game route  
2. Play 6-pair memory matching game
3. Cards flip with smooth animations
4. Track moves and completion time
5. Win detection with celebration modal
6. Restart or new game functionality

### 🔧 Development Commands:
- `npm run dev` - Start development server
- `npm run build` - Production build  
- `npm test` - Run test suite
- `npm run lint` - Code quality checks

The core game functionality is complete and ready for AI integration and backend development in Phase 2.

#####