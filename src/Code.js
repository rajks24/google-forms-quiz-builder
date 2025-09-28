/***** CONFIG *****/
const TEMPLATE_FORM_ID = "1kANsPRys7UKT9G9AKmeDeuBqZkgb984-gqIUruYTLpg"; // '' to disable
const MAKE_PUBLIC_ANYONE_WITH_LINK = true; // set false if you only want your domain/responders list

/***** MENU *****/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Form Builder")
    .addItem("Create Form (Confirm)", "confirmAndCreateForm")
    .addToUi();
}

/***** ENTRYPOINT *****/
function confirmAndCreateForm() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    "Create Form",
    "Create a new Google Form quiz and link responses to this spreadsheet (new tab)?",
    ui.ButtonSet.OK_CANCEL
  );
  if (res !== ui.Button.OK) return;

  try {
    const result = createFormFromActiveSpreadsheet();
    SpreadsheetApp.getActive().toast(
      "Form created successfully.",
      "Form Builder",
      5
    );
    ui.alert(
      "Success",
      "Form created. Responses will be stored in this spreadsheet (new tab).\n\n" +
        "Form (student link):\n" +
        result.publishedUrl +
        "\n\n" +
        "Form (edit link):\n" +
        result.editUrl +
        "\n\n" +
        "Responses (this file):\n" +
        result.responsesUrl +
        "\n",
      ui.ButtonSet.OK
    );
  } catch (e) {
    SpreadsheetApp.getActive().toast(
      "Form creation failed.",
      "Form Builder",
      5
    );
    ui.alert("Error", e && e.message ? e.message : String(e), ui.ButtonSet.OK);
  }
}

/***** CORE LOGIC (Section, Question, Type, Points, AnswerA..D) *****/
function createFormFromActiveSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find a sheet with our header
  let sh = ss.getActiveSheet();
  let values = sh.getDataRange().getDisplayValues();
  let cfg = findConfig(values);
  if (!cfg) {
    for (const s of ss.getSheets()) {
      const v = s.getDataRange().getDisplayValues();
      const c = findConfig(v);
      if (c) {
        sh = s;
        values = v;
        cfg = c;
        break;
      }
    }
  }
  if (!cfg)
    throw new Error(
      "Header row not found. Expected columns: Section, Question, Type, Points, AnswerA..D"
    );

  const {
    formTitle = "Untitled Quiz",
    formDescription = "",
    limitOneResponse,
    headerRowIndex,
  } = cfg;

  // Column indexes (by name)
  const header = values[headerRowIndex].map(String);
  const idx = headerIndex(header, [
    "Section",
    "Question",
    "Type",
    "Points",
    "AnswerA",
    "AnswerB",
    "AnswerC",
    "AnswerD",
  ]);

  // Section totals for headers
  const sectionTotals = computeSectionTotals(values, headerRowIndex, idx);

  // 1) Create shell (template copy or fresh)
  const form = createFormShell(formTitle, formDescription, ss.getId());
  const formId = form.getId();

  // 2) Destination + basic settings (no publish yet)
  form.setIsQuiz(true);
  form.setCollectEmail(true);
  if (parseBool(limitOneResponse, false)) form.setLimitOneResponsePerUser(true);
  form.setProgressBar(true);

  // Link responses to THIS spreadsheet
  try {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  } catch (_) {
    Utilities.sleep(400);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  }

  // Student details (ensures at least one item exists)
  form
    .addSectionHeaderItem()
    .setTitle("Student Details")
    .setHelpText("Please enter your name before you begin.");
  form.addTextItem().setTitle("Student Name").setRequired(true);

  // 3) Build questions
  let currentSection = null;
  for (let r = headerRowIndex + 1; r < values.length; r++) {
    const row = values[r];
    if (!row || row.length === 0 || row.every((v) => v === "" || v == null))
      continue;

    const section = (row[idx.Section] || "").toString().trim();
    const question = (row[idx.Question] || "").toString().trim();
    const type = (row[idx.Type] || "").toString().trim().toUpperCase();
    const pts = Number((row[idx.Points] || "").toString().trim()) || 0;

    const rawAns = [
      (row[idx.AnswerA] || "").toString().trim(),
      (row[idx.AnswerB] || "").toString().trim(),
      (row[idx.AnswerC] || "").toString().trim(),
      (row[idx.AnswerD] || "").toString().trim(),
    ];

    if (!section)
      throw new Error(
        `Missing "Section" in row ${r + 1} on sheet "${sh.getName()}"`
      );
    if (!type)
      throw new Error(
        `Missing "Type" in row ${r + 1} on sheet "${sh.getName()}"`
      );
    if (!question)
      throw new Error(
        `Missing "Question" in row ${r + 1} on sheet "${sh.getName()}"`
      );

    if (section !== currentSection) {
      currentSection = section;
      const total = sectionTotals[section] || 0;
      form
        .addPageBreakItem()
        .setTitle(`${section} Section — ${total} pts total`)
        .setHelpText("Answer all questions. Marks vary.");
    }

    const title = pts > 0 ? `${question}  (${pts} pts)` : question;

    switch (type) {
      case "SA": {
        const item = form.addTextItem().setTitle(title).setRequired(true);
        safeSetPoints(item, pts);
        break;
      }
      case "PARA": {
        const item = form
          .addParagraphTextItem()
          .setTitle(title)
          .setRequired(true);
        safeSetPoints(item, pts);
        break;
      }
      case "MCQ": {
        let choices = uniqueAnswers(rawAns).filter(Boolean);
        if (choices.length < 2) {
          const item = form.addTextItem().setTitle(title).setRequired(true);
          safeSetPoints(item, pts);
          break;
        }
        const mcq = form
          .addMultipleChoiceItem()
          .setTitle(title)
          .setRequired(true);
        let formChoices = choices.map((opt, i) =>
          mcq.createChoice(stripStar(opt), i === 0)
        );
        if (formChoices.length > 1) formChoices = shuffleArrayCopy(formChoices);
        mcq.setChoices(formChoices);
        safeSetPoints(mcq, pts);
        break;
      }
      case "MSQ": {
        const cleaned = uniqueAnswers(rawAns).filter(Boolean);
        if (cleaned.length < 2) {
          const item = form.addTextItem().setTitle(title).setRequired(true);
          safeSetPoints(item, pts);
          break;
        }
        const starredChoices = cleaned.filter(isStarred);
        if (starredChoices.length === 0) {
          const mcq = form
            .addMultipleChoiceItem()
            .setTitle(title)
            .setRequired(true);
          let choices = cleaned.map((opt, i) =>
            mcq.createChoice(stripStar(opt), i === 0)
          );
          if (choices.length > 1) choices = shuffleArrayCopy(choices);
          mcq.setChoices(choices);
          safeSetPoints(mcq, pts);
          break;
        }
        const cb = form.addCheckboxItem().setTitle(title).setRequired(true);
        let formChoices = cleaned.map((opt) =>
          cb.createChoice(stripStar(opt), isStarred(opt))
        );
        formChoices = shuffleArrayCopy(formChoices);
        cb.setChoices(formChoices);
        safeSetPoints(cb, pts);
        break;
      }
      default:
        throw new Error(
          `Unsupported Type "${type}" in row ${
            r + 1
          }. Use SA, PARA, MCQ, or MSQ.`
        );
    }
  }

  form.setAllowResponseEdits(false);
  form.setShuffleQuestions(false);

  // Small nudge so Drive finishes the copy & items commit
  Utilities.sleep(400);

  // Move near the spreadsheet (best effort)
  try {
    moveFormNextToSpreadsheet(formId, ss.getId());
  } catch (_) {}

  // 4) **Publish** and (optionally) set "Anyone with link"
  const urls = ensurePublishedAndOpen(form);

  if (MAKE_PUBLIC_ANYONE_WITH_LINK) {
    try {
      setAnyoneWithLinkResponder(formId);
    } catch (e) {
      Logger.log("setAnyoneWithLinkResponder: " + e);
    }
  }

  return {
    publishedUrl: urls.publishedUrl, // use this with students
    editUrl: urls.editUrl,
    responsesUrl: ss.getUrl(),
  };
}

/***** CREATE FORM FROM TEMPLATE (or new) *****/
function createFormShell(formTitle, formDescription, spreadsheetId) {
  let form;
  if (TEMPLATE_FORM_ID) {
    const templateFile = DriveApp.getFileById(TEMPLATE_FORM_ID);
    const copyFile = templateFile.makeCopy(formTitle);
    const newId = copyFile.getId();
    form = FormApp.openById(newId);
    Utilities.sleep(300);

    // Clear template items (keep theme/settings)
    form.getItems().forEach((it) => form.deleteItem(it));

    form.setTitle(formTitle).setDescription(formDescription);

    try {
      moveFormNextToSpreadsheet(newId, spreadsheetId);
    } catch (_) {}
  } else {
    // If your Forms service supports the 2nd param (isPublished), you could pass false here.
    form = FormApp.create(formTitle)
      .setDescription(formDescription)
      .setIsQuiz(true);
  }
  return form;
}

/***** PUBLISH + RETURN STABLE URL *****/
function ensurePublishedAndOpen(form) {
  // Ensure accepting responses after items exist
  try {
    form.setAcceptingResponses(true);
  } catch (_) {}

  // **NEW:** Publish the form (required for /d/e/... link to work)
  for (let i = 0; i < 3; i++) {
    try {
      form.setPublished(true);
      if (form.isPublished()) break;
    } catch (e) {
      Utilities.sleep(300);
    }
  }

  // Wait a moment for the published URL to materialize
  Utilities.sleep(400);

  // Prefer the official published URL (/forms/d/e/...)
  let publishedUrl = "";
  for (let i = 0; i < 20; i++) {
    try {
      publishedUrl = form.getPublishedUrl();
      if (publishedUrl && /\/forms\/d\/e\//.test(publishedUrl)) break;
    } catch (e) {}
    Utilities.sleep(250);
  }
  if (!publishedUrl) {
    // Fallback (rare): file-id URL
    publishedUrl = `https://docs.google.com/forms/d/${form.getId()}/viewform`;
  }

  const editUrl = form.getEditUrl();
  return { publishedUrl, editUrl };
}

/***** “Anyone with the link can respond” (Drive permission with view:'published') *****/
function setAnyoneWithLinkResponder(formId) {
  // Requires Advanced Service: Drive API enabled (and Drive API enabled in Cloud console)
  const body = { type: "anyone", role: "reader", view: "published" };

  // Drive API v3 in Advanced Service uses Permissions.create; older v2 uses Permissions.insert.
  // Try v3 first, then fall back to v2 for older tenants.
  try {
    if (Drive.Permissions && typeof Drive.Permissions.create === "function") {
      Drive.Permissions.create({
        fileId: formId,
        resource: body,
        supportsAllDrives: true,
      });
      return;
    }
  } catch (e) {
    Logger.log("Drive.Permissions.create failed, will try insert: " + e);
  }
  try {
    if (Drive.Permissions && typeof Drive.Permissions.insert === "function") {
      Drive.Permissions.insert(body, formId, { supportsAllDrives: true });
      return;
    }
  } catch (e2) {
    Logger.log("Drive.Permissions.insert failed: " + e2);
    throw e2;
  }
}

/***** CONFIG / HEADER HELPERS *****/
function findConfig(values) {
  if (!values || !values.length) return null;
  let formTitle = "",
    formDescription = "",
    limitOneResponse = "";
  let headerRowIndex = -1;

  for (let r = 0; r < values.length; r++) {
    const k = (values[r][0] || "").toString().trim().toLowerCase();
    if (!k) continue;

    if (k === "formtitle") {
      formTitle = (values[r][1] || "").toString().trim() || formTitle;
      continue;
    }
    if (k === "formdescription") {
      formDescription = (values[r][1] || "").toString().trim();
      continue;
    }
    if (k === "limitoneresponse") {
      limitOneResponse = (values[r][1] || "").toString().trim();
      continue;
    }

    const row = values[r].map((x) => (x || "").toString().trim().toLowerCase());
    if (
      row.includes("section") &&
      row.includes("question") &&
      row.includes("type") &&
      row.includes("points")
    ) {
      headerRowIndex = r;
      break;
    }
  }
  if (headerRowIndex === -1) return null;
  return { formTitle, formDescription, limitOneResponse, headerRowIndex };
}

function headerIndex(headerRow, requiredCols) {
  const idx = {};
  requiredCols.forEach((col) => {
    const i = headerRow.findIndex(
      (h) => h.toString().trim().toLowerCase() === col.toLowerCase()
    );
    if (i === -1)
      throw new Error(
        `Header "${col}" not found. Got: ${headerRow.join(", ")}`
      );
    idx[col] = i;
  });
  return idx;
}

/***** SECTION POINTS *****/
function computeSectionTotals(values, headerRowIndex, idx) {
  const totals = {};
  for (let r = headerRowIndex + 1; r < values.length; r++) {
    const row = values[r];
    if (!row || row.length === 0 || row.every((v) => v === "" || v == null))
      continue;
    const section = (row[idx.Section] || "").toString().trim();
    const pts = Number((row[idx.Points] || "").toString().trim()) || 0;
    if (!section) continue;
    totals[section] = (totals[section] || 0) + pts;
  }
  return totals;
}

/***** UTILITIES *****/
function uniqueAnswers(arr) {
  const seen = new Set();
  const out = [];
  for (const a of arr) {
    const key = a.replace(/\s+/g, " ").trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(a);
    }
  }
  return out;
}
function stripStar(s) {
  return s.replace(/^\s*\*/, "").trim();
}
function isStarred(s) {
  return /^\s*\*/.test(s);
}

function parseBool(s, fallback) {
  if (s == null || s === "") return fallback;
  switch (String(s).trim().toLowerCase()) {
    case "true":
    case "yes":
    case "y":
    case "1":
      return true;
    case "false":
    case "no":
    case "n":
    case "0":
      return false;
    default:
      return fallback;
  }
}

// Non-mutating shuffle
function shuffleArrayCopy(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function safeSetPoints(item, pts) {
  if (!pts || pts <= 0) return;
  try {
    item.setPoints(pts);
  } catch (_) {}
}

/***** MOVE HELPERS *****/
function moveFormNextToSpreadsheet(formId, spreadsheetId) {
  try {
    if (typeof Drive !== "undefined" && Drive.Files) {
      const src = Drive.Files.get(spreadsheetId, { supportsAllDrives: true });
      const dst = Drive.Files.get(formId, { supportsAllDrives: true });
      const srcParents = parentsToIds(src.parents);
      const dstParents = parentsToIds(dst.parents);
      if (srcParents.length) {
        const params = {
          addParents: srcParents.join(","),
          supportsAllDrives: true,
        };
        if (dstParents.length) params.removeParents = dstParents.join(",");
        Drive.Files.update({}, formId, null, params);
        return;
      }
    }
  } catch (e) {
    Logger.log("Advanced Drive move failed: " + e);
  }
  try {
    const file = DriveApp.getFileById(formId);
    const ssFile = DriveApp.getFileById(spreadsheetId);
    const parents = ssFile.getParents();
    if (parents.hasNext()) file.moveTo(parents.next());
  } catch (e2) {
    Logger.log("DriveApp move failed; leaving form in root: " + e2);
  }
}
function parentsToIds(parents) {
  if (!parents || !parents.length) return [];
  return typeof parents[0] === "string"
    ? parents.slice()
    : parents.map((p) => p.id);
}
