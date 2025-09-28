# Google Forms Quiz Builder

Turn a **Google Sheet of questions** into a fully published **Google Forms Quiz** with points, sections, and answer keys, all generated automatically using Apps Script.

---

## ✨ Features

- Define quizzes in a simple **Google Sheet** ([Questions.sheet-format.md](./sample/Questions.sheet-format.md))
- Supports multiple question types:
  - **SA** – Short Answer
  - **PARA** – Paragraph
  - **MCQ** – Multiple Choice (one correct)
  - **MSQ** – Multiple Select (checkboxes, multiple correct)
- Metadata support (`FormTitle`, `FormDescription`, `LimitOneResponse`)
- Points system with **section totals**
- Automatically:
  - Creates quiz form (from template or fresh)
  - Publishes & shares student link
  - Collects student name + email
  - Links responses to the same Sheet

## 📂 Repo Structure

```
google-forms-quiz-builder
├── docs
│   ├── screenshots
│   │   ├── app-script-codejs.jpg
│   │   ├── gform-quiz-generated.jpg
│   │   └── maths-assignment-sheet.jpg
│   └── SETUP.md
├── README.md
├── sample
│   ├── math_assignment1_questions.csv
│   └── Questions.sheet-format.md
└── src
    ├── appsscript.json
    └── Code.js
```

## 🚀 Quick Start

1. Open a Google Sheet and add rows as per [Questions.sheet-format.md](./sample/Questions.sheet-format.md).  
   (Try the sample: [math_assignment1_exact.csv](./sample/math_assignment1_questions.csv))

2. Go to **Extensions => Apps Script**.

   - Create a new file `Code.gs`
   - Paste in [src/Code.js](src/Code.js)

3. Optionally enable **Drive API** in Advanced Services.  
   See [SETUP.md](docs/SETUP.md) for details.

4. Reload the Sheet => Use the new **Form Builder** menu => `Create Form (Confirm)`.

5. A fully published quiz is created 🎉

## 🤝 Contributing

Contributions are welcome!  
Fork the repo, create a feature branch, and open a PR.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- Built with **Google Apps Script** + **Google Forms API**
- Inspired by teachers wanting **faster quiz creation**
