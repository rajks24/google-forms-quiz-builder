# Questions Sheet Format

This sheet drives the **Google Forms Quiz Builder**.  
It supports a small **metadata block** followed by a **questions table**.

---

## 1) Metadata rows (top of sheet)

Place these in the first column (A), one per row:

| Key                | Value (Column B)                | Notes                                               |
| ------------------ | ------------------------------- | --------------------------------------------------- |
| `FormTitle`        | e.g., `Math Assignment1`        | Title for the generated Form copy.                  |
| `FormDescription`  | e.g., `Maths quiz for beginner` | Optional; appears under the title.                  |
| `LimitOneResponse` | `TRUE` / `FALSE`                | If `TRUE`, requires sign-in & limits to 1 per user. |

Add a **blank row** after metadata, then the questions header.

> The script looks for `FormTitle`, `FormDescription`, `LimitOneResponse` case-insensitively in column A.  
> If any are missing, defaults are used (title: _Untitled Quiz_, description empty, limit false).

## 2) Questions header (required)

Create this header row exactly (order matters):

```
Section | Question | Type | Points | AnswerA | AnswerB | AnswerC | AnswerD
```

- Header matching is **case-insensitive** but spelling must match.
- Only `AnswerA..AnswerD` are parsed (max 4 options).

## 3) Question rows (one per row)

| Column         | Required | Description                                                                                                               |
| -------------- | :------: | ------------------------------------------------------------------------------------------------------------------------- |
| **Section**    |    ✅    | Groups questions and inserts a page break titled: `"<section> Section — <sum pts> pts total"`.                            |
| **Question**   |    ✅    | The prompt shown to students.                                                                                             |
| **Type**       |    ✅    | One of: `SA` (short answer), `PARA` (paragraph), `MCQ` (single choice), `MSQ` (checkboxes). Matching is case-insensitive. |
| **Points**     |    ✅    | Integer points for the item. Non-numeric or blank → treated as **0**.                                                     |
| **AnswerA..D** |    ✅    | Used for `MCQ`/`MSQ`. Leave blanks if not needed (e.g., for `SA`, `PARA`).                                                |

### Type-specific rules

- **SA (Short Answer)**

  - Free-text; `AnswerA..D` ignored.
  - Points supported.

- **PARA (Paragraph)**

  - Long answer; `AnswerA..D` ignored.
  - Points supported.

- **MCQ (Multiple Choice, one correct)**

  - Provide ≥ 2 unique options among `AnswerA..D`.
  - **Correct answer = `AnswerA`** (first non-blank).
  - Options are **shuffled** for students.
  - If < 2 options remain after de-dupe → falls back to **SA**.

- **MSQ (Checkboxes, multiple correct)**
  - Mark each correct option by prefixing with `*` (asterisk). Example: `*2/3`.
  - Provide ≥ 2 options. At least **1 starred** option required.
  - Options are **shuffled** for students.
  - If no starred options → downgraded to **MCQ** (with `AnswerA` correct).
  - If < 2 options after de-dupe → falls back to **SA**.
  - The `*` is **not shown** to students; it’s only for the answer key.

## 4) Answer handling

- **Uniqueness/cleanup**: Options are trimmed and compared case-insensitively; duplicates are removed.
- **Empty cells**: Fine; leave unused `AnswerC/D` blank.
- **Formulas**: Avoid formulas that evaluate to empty strings — prefer literal blanks.

## 5) Section behavior

- When the `Section` value changes, the script inserts a **new page** with:
  - Title: `"<section> Section — <total points in this section> pts total"`.
- Section totals = sum of `Points` in that section (non-numeric → 0).

## 6) What the script does automatically

- Creates a Form (from template if configured) in **Quiz mode**.
- Collects email; adds a required **Student Name** question.
- Links responses to the **same spreadsheet** (new “Form Responses” tab).
- Publishes the Form and retrieves the student link (`/forms/d/e/.../viewform`).
- Optionally sets **“Anyone with the link”** (if allowed by domain settings).

## 7) Tips & gotchas

- Keep `Type` limited to: `SA`, `PARA`, `MCQ`, `MSQ`.
- `Points` must be integer; non-numeric = 0.
- For `MSQ`, remember to star (`*`) every correct option.
- Avoid trailing spaces (`"0.3 "` → `"0.3"`).
- Fractions/percentages/decimals can be plain text: `2/3`, `12.5%`, `0.125`.
