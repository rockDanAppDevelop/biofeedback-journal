# Biofeedback Journal Project Playbook

מסמך זה הוא source of truth קצר לדרך העבודה בפרויקט Biofeedback Journal. בכל Lab Conversation חדשה אפשר להפנות אליו כדי ליישר קו מהר על workflow, גבולות, ו־Definition of Done.

## 1. Project Overview

Biofeedback Journal היא אפליקציה לניהול יומן תרגולי biofeedback, ניטור, תכנון routines, reminders, ו־streaks.

העיקרון המרכזי: `main` תמיד יציב. כל שינוי שנכנס ל־`main` צריך להיות קטן, מובן, מאומת, וללא רעש צדדי.

## 2. Core Workflow

- עובדים בדלתות קטנות.
- קודם מיפוי והבנה, אחר כך קוד.
- שינויי קוד נעשים רק אחרי scope ברור ואישור.
- לא עושים refactor רחב בלי אישור מפורש.
- לא משנים קבצים לא קשורים.
- אם מתגלה נושא צדדי, מתעדים אותו או מציעים follow-up, ולא מערבבים אותו בדלתא הנוכחית.
- בסיום כל שינוי מחזירים תמיד:
  - Changed files
  - Delta
  - Verification
  - Manual tests

## 3. Git & Versioning

- `main` תמיד יציב.
- עבודה ניסיונית מתבצעת בענפי feature, לא ישירות ב־`main`.
- המשתמש עושה בפועל commits, push, tags, ו־release actions.
- Codex יכול להציע commit message, אבל לא עושה commit בלי אישור מפורש.
- לפני commit מריצים:

```bash
npx tsc --noEmit
git diff --check
```

- אין temporary debug logs לפני commit.
- version bump נעשה רק בקבצי version/build רלוונטיים, בלי שינוי dependencies ובלי שינוי לוגיקה.

## 4. Codex Collaboration Rules

- תשובות בעברית.
- שמות קבצים, commands, branches, functions, ו־technical terms נשארים באנגלית.
- Codex לא מניח שהמשתמש רוצה refactor אם הוא ביקש bug fix קטן.
- Codex לא משנה קבצים לא קשורים ולא מנקה שינויים שלא הוא יצר.
- כשמבוקש מיפוי בלבד, לא משנים קוד.
- כשמבוקש קוד, Codex מיישם, מאמת, ומסכם את הדלתא בפשטות.
- אם יש אי־ודאות מוצרית, עוצרים וממפים לפני ביצוע.

## 5. Architecture Principles

- מעדיפים patterns קיימים בקודbase על פני abstraction חדש.
- מוסיפים abstraction רק אם הוא מוריד duplication אמיתי או מבהיר contract שחוזר בכמה מקומות.
- logic משותפת עדיף להעביר ל־`lib` ייעודי, ולא לשכפל בין screens.
- UI screens לא צריכים להפוך למקום שבו מתרכזת domain logic מורכבת.
- monitoring לא נספר כ־practice ולא משפיע על streak.
- practice streak מבוסס על practice entries בלבד.

## 6. Notification Principles

- notification reminders הם local notifications כרגע.
- planned reminder חייב להיות מוקדם יותר מ־daily reminder.
- אין auto-adjust לשעות תזכורת. אם השעות לא תקינות, המשתמש צריך לבחור שעה אחרת.
- לא מוחקים notifications בצורה רחבה מדי.
- cleanup של notifications צריך להיות ממוקד לפי `kind` ו־identifier מתאים.
- הכיוון המוצרי ל־planned reminders הוא per planned item / planned practice:
  - לכל planned item פתוח תהיה notification משלו.
  - `content.data` צריך לכלול `kind`, `plannedPracticeId`, `dateKey`, ואפשר גם `routineItemId`.
  - כשמשלימים planned item מסוים, מנקים רק את ה־notification שלו.
  - אם נשארים planned items פתוחים, ה־notifications שלהם נשארות.

## 7. Stable vs Experimental

- Stable work: bug fixes קטנים, version bumps, copy/docs, ושינויים ממוקדים עם Verification ברור.
- Experimental work: שינויי flow, שינויי notification model, refactor, או שינויי data model.
- Experimental work נעשה בענף feature וממופה מראש.
- לא מערבבים stable bug fix עם experimental product direction באותה דלתא.

## 8. Definition of Done

שינוי נחשב Done כאשר:

- הדלתא תואמת ל־scope שאושר.
- לא שונו קבצים לא קשורים.
- אין temporary debug logs.
- `npx tsc --noEmit` עבר.
- `git diff --check` עבר לפני commit.
- הסיכום כולל:
  - Changed files
  - Delta
  - Verification
  - Manual tests
- אם לא ניתן להריץ בדיקה מסוימת, מציינים זאת במפורש.

## 9. Starting a New Lab Conversation

בפתיחת Lab Conversation חדשה כדאי לכלול:

- current version, למשל `0.11.1`
- current branch
- `git status --short`
- scope מבוקש
- מה כבר הוחלט
- מה לא לשנות
- מה מבוקש עכשיו: מיפוי בלבד, implementation, review, version bump, או docs

תבנית קצרה:

```text
Project: Biofeedback Journal
Version: <current version>
Branch: <current branch>
Status: <git status summary>
Scope: <what we are doing now>
Do not change: <explicit boundaries>
Request: <mapping / implementation / review / docs>
```

## 10. Decisions Log

- `main` נשאר stable תמיד.
- עובדים בדלתות קטנות.
- קודם מיפוי, אחר כך קוד.
- המשתמש מבצע commits/push/tags בפועל.
- Codex מציע commit message אבל לא עושה commit בלי אישור.
- planned reminder מוקדם יותר מ־daily reminder.
- אין auto-adjust לשעות תזכורת.
- monitoring לא נספר כ־practice ולא משפיע על streak.
- notification reminders הם local notifications כרגע.
- מעבר ל־per planned item notifications נחשב שינוי מוצרי/ארכיטקטוני קטן, לא bug fix שקט.
