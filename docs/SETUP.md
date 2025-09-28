# Setup Guide

This project turns a Google Sheet of questions into a fully published Google Form quiz.  
We can run it as a **container-bound Apps Script** inside our Sheet (simplest method).

---

## 1) Prepare your Google Sheet

1. Create or open a Google Sheet (e.g. `Questions`).
2. Add rows according to [Questions Sheet Format](../sample/Questions.sheet-format.md).
   - Start with metadata rows (`FormTitle`, `FormDescription`, `LimitOneResponse`).
   - Leave a blank row.
   - Add the questions table (`Section, Question, Type, Points, AnswerA..D`).

We can also import the provided sample CSV:  
[sample/questions.sample.csv](../sample/math_assignment1_questions.csv)

## 2) Add the Apps Script

1. In your Sheet: go to **Extensions => Apps Script**.
2. In the editor:
   - Create or update the file named `Code.gs`.
   - Copy all contents from [src/Code.js](../src/Code.js) into it.
3. (Optional but recommended) Enable **Project Settings => Show “appsscript.json” manifest file**
   - Add [src/appsscript.json](../src/appsscript.json) for scopes and advanced services.

## 3) Enable Drive API (optional)

This script needs the Drive API to adjust sharing and publish settings.

1. In the Script Editor:
   - Click the **+ Services** icon (left sidebar).
   - Enable **Drive API v2** (Advanced Google Services).
2. In the popup footer, click **Google Cloud Platform API dashboard**.
   - Ensure **Drive API** is enabled for your account/project.

## 4) Configure

At the top of `Code.gs` we’ll find configuration options:

```javascript
const TEMPLATE_FORM_ID = "YOUR_TEMPLATE_FORM_ID"; // or '' for a fresh blank Form
const MAKE_PUBLIC_ANYONE_WITH_LINK = true; // true = allow external students
```
