# MarksJEE 🚀
### Offline-First JEE Main & Advanced PYQ Practice Platform
*Modeled after Marks by MathonGo*

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/IndexedDB-Dexie.js-orange)](https://dexie.org/)
[![KaTeX](https://img.shields.io/badge/Math-KaTeX-00D8A2)](https://katex.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MarksJEE** is a high-performance, offline-first practice platform for JEE Main & JEE Advanced aspirants. Practice chapter-wise Previous Year Questions (PYQs), take timed NTA-style Computer Based Tests (CBT), view mathematical step-by-step LaTeX solutions, import custom question bundles, and monitor your accuracy — completely without an active internet connection.

---

## ✨ Features

- **⚡ 100% Offline-First Storage:** Powered by IndexedDB via `Dexie.js`. Questions, user attempts, bookmarks, notes, and mock test histories are cached locally on your device.
- **📐 Mathematical Rendering with KaTeX:** Crisp rendering of inline `$..$` and block `$$..$$` equations, fractions, matrices, integrals, vectors, and chemical reaction mechanisms without lag.
- **🎯 Authentic JEE Question Formats:**
  - Single Choice Questions (+4, -1)
  - Multiple Correct Questions (+4, -2 with partial marking guidance)
  - Numerical Value Type (+4, 0 with decimal range tolerance and on-screen keypad)
  - Matrix Match Questions (+3, -1 Column I vs Column II)
- **🖥️ NTA JEE CBT Mock Exam Simulator:**
  - Live countdown timer (30 / 60 / 180 mins)
  - Section switcher (Physics, Chemistry, Mathematics)
  - NTA CBT Question Palette (Green: Answered, Red: Unanswered, Purple: Marked for Review, Purple+Green dot: Answered & Marked for Review, Gray: Not Visited)
  - Comprehensive post-test analysis report (Score, Accuracy %, Subject-wise breakdown, and Question-by-question review).
- **💡 Step-by-Step Solutions & Shortcuts:**
  - Detailed derivations
  - Key concepts and formula tags
  - MathonGo-style alternative shortcut methods & tricks
  - Personal revision notes saved per question in IndexedDB
- **📦 Offline Question Pack Ingestion:**
  - Drag-and-drop `.json` question bundles into the app to instantly seed new chapters.
  - Export full user backup `.json` (progress, attempts, notes, tests) and restore anytime.
  - Downloadable JSON template for educators and students.
- **📱 Progressive Web App (PWA):**
  - Installable on desktop (Chrome, Edge) and mobile (Android, iOS Safari).
  - Background asset precaching via Service Worker.

---

## 🚀 Deploying to GitHub

This repository is pre-configured with a zero-config GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployment to **GitHub Pages**.

### One-Click GitHub Pages Setup

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MarksJEE"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages via Actions:**
   - In your GitHub repository, click on **Settings** (top tab).
   - In the left sidebar, click on **Pages** (under *Code and automation*).
   - Under **Build and deployment > Source**, select **GitHub Actions**.

3. **Automatic Deployment:**
   - On every push to `main` (or `master`), the GitHub Actions workflow will automatically build the Vite app and deploy it to:
     ```
     https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY>/
     ```
   - Assets use relative paths (`base: './'`), so it works out-of-the-box on both GitHub Pages subpaths and custom domains.

---

## 💻 Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Setup & Run
```bash
# 1. Clone repository
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
cd <YOUR_REPOSITORY>

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# App runs at: http://localhost:3000
```

### Build & Preview
```bash
# Build production bundle into dist/
npm run build

# Preview production build locally
npm run preview

# Run TypeScript validation & linting
npm run lint
```

---

## 📂 Project Architecture

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions workflow for GitHub Pages
├── public/
│   ├── icon.svg              # Vector brand icon
│   ├── favicon.ico           # Browser tab favicon
│   ├── apple-touch-icon.png  # iOS Safari home screen icon (180x180)
│   ├── pwa-192x192.png       # Android home screen icon
│   ├── pwa-512x512.png       # Splash screen icon
│   └── pwa-maskable-512x512.png
├── src/
│   ├── components/
│   │   ├── CBTExamModal.tsx       # NTA CBT Mock Exam simulator & score report
│   │   ├── ChapterNavigator.tsx   # Subject & chapter breakdown with progress %
│   │   ├── MathRenderer.tsx       # Safe KaTeX LaTeX math renderer
│   │   ├── Navbar.tsx             # Brand header & navigation tabs
│   │   ├── OfflineIndicator.tsx   # Offline status banner
│   │   ├── OfflinePackManager.tsx # Drag & drop JSON importer & backup exporter
│   │   ├── PWAInstallButton.tsx   # In-app PWA install trigger (Desktop/Android/iOS)
│   │   ├── QuestionCard.tsx       # Interactive question card with instant solution
│   │   ├── TestPalette.tsx        # 1-to-N JEE CBT question status grid
│   │   └── usePWAInstall.ts       # PWA event handler hook
│   ├── data/
│   │   └── initialQuestions.ts    # Seed dataset of authentic JEE Main & Adv questions
│   ├── db/
│   │   └── dexieDB.ts             # IndexedDB Dexie.js database & CRUD helpers
│   ├── types/
│   │   └── question.ts            # Normalized TypeScript interfaces
│   ├── App.tsx                    # Main app container & mode switcher
│   ├── index.css                  # Tailwind CSS styling
│   └── main.tsx                   # React root mount & KaTeX CSS import
├── index.html                     # HTML entry point with metadata & PWA tags
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # TypeScript compiler settings
└── vite.config.ts                 # Vite bundler, PWA plugin & relative base path
```

---

## 📋 Offline Question Pack Format (.json)

You can import custom question bundles by dropping a `.json` file into the **Offline Packs** tab:

```json
{
  "version": "1.0.0",
  "name": "Class 12 Calculus PYQs (2020-2024)",
  "exportedAt": "2026-09-25T10:00:00Z",
  "questions": [
    {
      "id": "math-calc-001",
      "subject": "mathematics",
      "subSubject": "calculus",
      "chapterId": "definite-integration",
      "chapterName": "Definite Integration",
      "topic": "King's Property",
      "examType": "JEE Main",
      "year": 2024,
      "session": "Jan 29 Shift 1",
      "questionType": "single_choice",
      "difficulty": "Medium",
      "questionText": "Evaluate $\\int_0^{\\pi} \\frac{x \\sin x}{1 + \\cos^2 x} dx$.",
      "options": [
        { "id": "A", "text": "$\\frac{\\pi^2}{2}$" },
        { "id": "B", "text": "$\\frac{\\pi^2}{4}$" },
        { "id": "C", "text": "$\\frac{\\pi}{4}$" },
        { "id": "D", "text": "$\\pi^2$" }
      ],
      "correctAnswer": "B",
      "solution": {
        "steps": [
          {
            "title": "Step 1: King's Property",
            "content": "Apply $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$."
          }
        ],
        "finalAnswer": "B",
        "keyConcepts": ["King's Rule", "Definite Integration"],
        "shortcutMethod": "Symmetry about $\\pi/2$ eliminates $x$ directly."
      }
    }
  ]
}
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
