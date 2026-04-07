# TangoKun — Project Context for Claude

TangoKun is a Japanese vocabulary learning app built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, NextAuth v5, and Prisma + PostgreSQL (Neon). Deployed on Vercel.

---

## Tech Stack

- **Framework**: Next.js 15 App Router, TypeScript
- **Styling**: Tailwind CSS v4
- **Auth**: NextAuth v5
- **Database**: Prisma + PostgreSQL (Neon)
- **AI**: OpenAI gpt-4o-mini (sentence generation + answer judging)
- **TTS**: Azure Cognitive Services (ja-JP-NanamiNeural / ja-JP-KeitaNeural, randomly picked)
- **Testing**: Vitest 4.x

---

## Features Built

### Vocabulary
- Add, edit, delete vocabulary words (jp / en)
- Organize into decks
- Paginated vocab page with search, mastery filter, deck filter
- Import vocab (bulk)

### Practice
- **Session creation**: Each selected word generates 2 practice questions (sentences) via OpenAI
- **Directions**: JP→EN (listen/read Japanese, answer in English) or EN→JP (read English, answer in Japanese)
- **Input modes**: Voice (Web Speech API) or keyboard text input — mode persists across questions
- **Retry system**: Wrong answers are re-queued once (MAX_RETRIES = 1)
- **Sentence variety**: Randomized scenario + subject injected into Japanese-language prompt
- **Vocabulary restriction**: AI is given up to 10 of the user's known words and instructed to use only those or JLPT N5 basics as supporting vocabulary
- **Word hints**: All notable words in the sentence are underlined. Click any to reveal reading + meaning. Target word = violet underline, supporting words = gray underline.
- **Grammar integration**: Optional — user can select grammar patterns (JLPT/Genki) to weave into sentences
- **Audio**: Azure TTS generates audio per sentence; preloaded during "loading" phase
- **Judging**: `/api/judge` uses OpenAI to evaluate free-text answers with feedback
- **Sound effects**: Correct (bell), wrong (buzz), session complete (fanfare)

### Progress & SRS
- **Mastery system**: Each word has a mastery state based on session history (see below)
- **SRS due words**: Words become "due for review" based on mastery × time since last seen (see below)
- **Session results**: After each session, progress is saved to DB and mastery recalculated
- **Streak tracking**: Requires ≥ 10 questions answered per day (counted via PracticeLog)

### Practice Setup
- Select individual words, a deck, or use quick-select buttons:
  - **Review due (X)** — auto-selects words due for SRS review today (violet, most important)
  - **Focus weak (X)** — auto-selects words with mastery = new or learning (amber)
  - **Select all / Deselect all**
- Session size indicator: shows word count + question count, warns if < 5 or > 20 words
- Grammar tab: JLPT or Genki grouping

### Finished Phase (post-session summary)
- Score + progress bar
- Streak banner (🔥 complete if ≥ 10 questions today, otherwise shows remaining)
- Sentences practiced: each sentence with ✓/✗, user's wrong answer + AI feedback
- Word status: mastery before → after (if changed), retry badge, final result dot
- Buttons:
  - **Practice again** — restarts with same word selection
  - **Practice mistakes (X words)** — restarts with only wrong words, no setup needed
  - **Back to setup**

---

## Mastery System

Mastery is computed from `VocabularyProgress` (stored in DB) using the last 10 session scores.

| State | Meaning | Requirement |
|-------|---------|-------------|
| **new** | Never practiced | 0 sessions |
| **learning** | Not enough data yet | < 3 sessions (regardless of score) |
| **familiar** | Getting there | ≥ 3 sessions AND recent avg score ≥ 60% |
| **strong** | Solid knowledge | ≥ 5 sessions AND recent avg score ≥ 80% |
| **mastered** | Long-term retention | ≥ 8 sessions AND recent avg score ≥ 90% |

**Score per session** = correct answers / total attempts for that word in the session (0.0–1.0).
The rolling window keeps the last 10 session scores; older sessions drop off.

A word **goes up** in mastery when recent accuracy is high enough over enough sessions.
A word **goes down** when recent accuracy drops (e.g. strong → familiar if avg drops below 80%).

---

## SRS — Due Words

"Due for review" means: enough time has passed since the word was last practiced, based on its mastery level.

| Mastery | Review interval |
|---------|----------------|
| new | Always due (never practiced) |
| learning | Due after 1 day |
| familiar | Due after 3 days |
| strong | Due after 7 days |
| mastered | Due after 14 days |

A word is due if: `lastSeen + interval ≤ today`

**"Review due (X)"** button in setup auto-selects all due words so the user doesn't have to think about what to study. This is the primary study mode for retention.

---

## AI Prompts

Sentence generation prompts are **written in Japanese** for more natural output (in `features/practice/sentenceGenerator.ts`).

Key rules enforced in the prompt:
- Use only the target word + user's known words (passed as list) + JLPT N5 basics
- Avoid stereotypical sentences (食べる→ご飯、読む→本)
- Avoid unnatural subject+verb combinations (e.g. 私は〜ましょう)
- Return `wordInSentence` (exact conjugated surface form), `supportingWords` (up to 5 other words with reading + meaning), `furigana`, `translation`

---

## Key File Locations

| What | Where |
|------|-------|
| Sentence generation | `features/practice/sentenceGenerator.ts` |
| Session orchestration | `features/practice/createSession.ts` |
| Question slot building | `features/practice/generateQuestions.ts` |
| Mastery logic | `features/progress/aggregation.ts` |
| Progress save | `features/progress/progressService.ts` |
| Practice page | `app/practice/page.tsx` |
| Practice hooks | `app/practice/_hooks/` |
| Practice components | `app/practice/_components/` |
| TTS route | `app/api/tts/route.ts` (Azure) |
| Judge route | `app/api/judge/route.ts` |
| Progress API | `app/api/progress/` |

---
3/22 created
## Planned / Next Steps

- [x] Dashboard with Study Now button
- [x] Auto-session that skips setup screen (compose due + new words automatically)
- [x] Daily new word cap setting (stored in localStorage, configurable in Settings → Learning)
- [ ] Onboarding flow (path choice + daily goal)
- [ ] Structured deck progression (ordered word lists, suggest next words to add)
- [ ] Proper SM-2 algorithm (easeFactor + interval columns) for more accurate SRS
- [ ] Conjugation hints (show base form alongside conjugated form)
- [ ] Hint usage tracking (detect if student is relying on hints too much)

---

## Target User Flow

### First Time
```
Sign up
  → Onboarding: choose path (structured deck OR add own words) + set daily word goal
  → Add first words (auto-suggested from deck, or manual)
  → First practice session (auto-started, no setup screen)
  → Finished → streak starts
```

### Returning (Daily)
```
Open app → Dashboard
  → "Study Now — 5 due + 5 new"  [Start →]
  → Practice (no setup screen)
  → Finished → streak updated
  → Optional: "3 new words ready from your deck" [Review]
```

### Dashboard layout
```
こんにちは [name]
🔥 Streak: N days

┌─────────────────────────────────────┐
│  Study Now                          │
│  5 due for review  +  5 new words   │
│              [Start →]              │
└─────────────────────────────────────┘

Words learned: 12  |  Mastered: 0  |  Due today: 5

Next words in deck: 始める · 終わる · 選ぶ   [Review]

[Custom session]   [Add words]   [Vocab]
```

### Word Addition — Structured Deck Path
```
Deck: JLPT N5 (800 words)
You've learned: 1–32

Next up:
  33. 始める  to begin    [Add] [Skip]
  34. 終わる  to finish   [Add] [Skip]
  35. 選ぶ   to choose   [Add] [Skip]
             [Add all]
```

### Word Addition — Free Path (current strength)
```
User adds any words manually (from class, shows, books, etc.)
Newly added words enter the SRS queue and get introduced
up to the daily cap alongside review words.
```

### What Needs to Be Built
| Screen | Status |
|--------|--------|
| Landing page | unknown |
| Sign up / login | ✅ exists |
| Onboarding (path + daily goal) | ❌ new |
| Structured deck browse + pick | ❌ new |
| Dashboard with Study Now | ❌ new |
| Auto-session (skip setup) | ❌ new |
| Daily new word cap logic | ❌ new |
| Custom session (current practice page) | ✅ exists |
| Add own words | ✅ exists |
