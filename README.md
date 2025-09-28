# Automated Google Form Quiz Builder (Apps Script)

Turn a question bank in Google Sheets into a **fully published Google Form quiz**—with one click.

- ✅ Copies a **template Form** (keeps theme/settings)
- ✅ Builds sections & questions from **Google Sheets**
- ✅ Sets **points** and supports **SA / PARA / MCQ / MSQ** (multi-select)
- ✅ Links responses to your spreadsheet
- ✅ **Publishes** the form and provides the student-facing **/d/e/.../viewform** URL
- ✅ (Optional) Makes it open to **anyone with the link** via Drive permission

> Built for teachers, schools, and training teams to save hours per quiz.

---

## Demo (what it does)

1. You maintain a Sheet with headers: `Section, Question, Type, Points, AnswerA, AnswerB, AnswerC, AnswerD`.
2. Click **Form Builder → Create Form (Confirm)** in the Sheet.
3. A new Form quiz is created from your **template**, published, and the student URL is shown.

---

## Quick Start

### 1) Clone & install clasp

```bash
git clone https://github.com/<your-username>/apps-script-quiz-builder.git
cd apps-script-quiz-builder
npm i -g @google/clasp
clasp login
```
