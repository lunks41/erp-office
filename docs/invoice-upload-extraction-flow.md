# Invoice Upload & Auto-Extraction — Flow & Design

## 1. What You Want

- **AP Invoice** and **CB Petty Cash**: add a separate **Upload** button on the **Main** tab.
- On upload of a **supplier invoice** (PDF/image):
  - Auto-recognize: **supplier name**, **remarks**, **line items**.
  - Auto-map to **GL codes** (proper mapping).

You also want to decide: **separate Python API** vs **in this (Next.js) app**, and whether to have a **common screen** (dropdown: AP Invoice, CB Petty Cash, others) or **per-screen** upload.

---

## 2. What “Auto-Recognize” Involves

| Step | What it does | Typical tech |
|------|----------------|--------------|
| **1. OCR** | Get text (and layout) from PDF/image | Azure Document Intelligence, Google Document AI, AWS Textract, or Tesseract |
| **2. Extraction** | Get supplier name, dates, amounts, line items (desc, qty, unit price, amount) | Same APIs (prebuilt invoice model) or custom parsing + LLM |
| **3. GL mapping** | Map line description/category → your GL codes | Rules (keyword → GL), or ML/LLM, or lookup table |

So you need **document intelligence** (OCR + extraction). GL mapping can be rule-based or AI-based.

---

## 3. Where to Put the Logic: Python vs This App

### Option A — Python (or other) microservice

- **Pros**
  - Best ecosystem for OCR/ML (e.g. `pdf2image` + Tesseract, or SDKs for Azure/Google/AWS).
  - Easy to use **prebuilt invoice models** (Azure, Google, AWS) that return structured invoice fields.
  - Can add custom ML/LLM for GL mapping later.
- **Cons**
  - Extra service to deploy, monitor, secure.
  - Need to call it from Next.js (e.g. Next.js API route → Python service).

### Option B — All in this (Next.js) app

- **Pros**
  - Single codebase and deployment.
  - Use **cloud document APIs** from Next.js API routes (no Python): e.g. Azure Document Intelligence, Google Document AI, or AWS Textract (via REST/Node SDK).
- **Cons**
  - Heavier dependencies in Node; for advanced ML/GL logic you might still want a separate service later.

### Recommendation

- **Start in this app** using a **cloud document API** (e.g. **Azure Document Intelligence** “prebuilt invoice” or **Google Document AI** “Invoice Parser”) from a **Next.js API route**:
  - No new Python app to maintain initially.
  - These APIs return supplier name, dates, line items, amounts; you then map to your form and GL.
- Add a **separate Python (or Node) service** later only if you need:
  - Heavy custom ML for GL mapping, or
  - On-prem/self-hosted OCR (e.g. Tesseract) and don’t want to use cloud.

---

## 4. Common Screen vs Per-Screen Upload

### Option 1 — Per-screen upload (recommended for first version)

- **AP Invoice** Main tab: one “Upload invoice” button.
- **CB Petty Cash** Main tab: one “Upload invoice / receipt” button.
- Each button:
  - Opens a small dialog/modal on the same page.
  - User selects file → upload → same page shows “Extracting…” → result pre-fills **this** form (AP Invoice or CB Petty Cash).
- **Pros**: Simple, clear context (user is already on the right transaction type). No navigation.  
- **Cons**: If you add more modules (e.g. AR, others), you repeat similar UI (can be shared component).

### Option 2 — Common “Upload & Extract” screen

- One shared screen (e.g. `/documents/upload-extract` or under a menu).
- Dropdown: **Document type** = “AP Invoice”, “CB Petty Cash”, (future: “AR Invoice”, etc.).
- User uploads file → system extracts → then either:
  - **A)** Show result on same screen and a button “Create AP Invoice” / “Create CB Petty Cash” that navigates to the right form with data passed (e.g. query/state), or  
  - **B)** After extraction, redirect to the chosen module’s **new** form with extracted data pre-filled.
- **Pros**: One place for all “upload then create from document”; good for power users.  
- **Cons**: Extra navigation; need to pass extracted payload to target form (e.g. via route state or API).

### Recommendation

- **Phase 1**: **Per-screen upload** on AP Invoice and CB Petty Cash Main tabs (separate button each). Same backend “extract” API, different form pre-fill.
- **Phase 2 (optional)**: Add a **common screen** that uses the same extract API and dropdown (AP Invoice / CB Petty Cash / …), then navigates to the correct form with extracted data.

---

## 5. Detailed Flow (Per-Screen — e.g. AP Invoice)

### 5.1 UI (Main tab)

1. On **AP Invoice** page, **Main** tab: add an **“Upload invoice”** button (e.g. next to Save or in the header of the main tab).
2. Click → open **modal/dialog**:
   - File input (PDF / images).
   - Optional: “Extract” or “Upload & extract” single action.
3. On submit:
   - Upload file to your app (e.g. `POST /api/invoice-extract/upload` or similar).
   - Show “Extracting…” state.

### 5.2 Backend (this app)

4. **Next.js API route** (e.g. `app/api/invoice-extract/route.ts`):
   - Receives file (multipart).
   - Optionally saves file temporarily.
   - Calls **document intelligence API** (Azure / Google / AWS):
     - Send file (or URL if already stored).
     - Get back structured JSON: vendor name, invoice number, dates, line items (description, quantity, unit price, amount), totals, tax.
   - **Mapping layer** (in Node):
     - Map vendor name → **supplier** (e.g. match by name to your supplier list; return `supplierId` or suggest list).
     - Map line items to your **detail line** structure (description → remarks; amounts → line amounts).
     - **GL mapping**: from line description/category → `glId` / `glCode` (e.g. keyword rules or lookup table; later can be LLM).
   - Return a **single DTO** tailored to the caller:
     - For AP Invoice: `{ supplierId?, supplierName?, remarks?, suppInvoiceNo?, trnDate?, lineItems: [{ description, amount, glId?, ... }], totals? }`.
     - For CB Petty Cash: similar but with payee, etc.

5. Frontend receives the DTO and **pre-fills the form**:
   - Header: supplier (or list to choose), remarks, dates, supplier invoice no, etc.
   - Details: one row per line item with description, amount, and **GL code** (pre-filled from mapping).
   - User can correct and save as usual.

### 5.3 CB Petty Cash

- Same flow, but:
  - Upload button on **CB Petty Cash** Main tab.
  - Same or shared extract API; response shape for CB Petty Cash: payee, remarks, line items with GL.
  - Pre-fill **CbPettyCash** form (header + `data_details`).

### 5.4 GL mapping (important)

- **Input**: line item description (and optionally category if your API provides it).
- **Output**: `glId` (and optionally `glCode`/`glName`) for your chart of accounts.
- **Ways to implement**:
  1. **Lookup table**: e.g. `description_keyword` → `glId` (admin-maintained).
  2. **Rules**: if description contains “office supplies” → GL X; “travel” → GL Y.
  3. **LLM (later)**: “Given this line description and list of GL accounts, pick the best match.”
- First version: **rules or lookup table** in this app (or in your existing backend); no Python required.

---

## 6. Technical Pieces in This Repo

- **New Next.js API route**: e.g. `app/api/invoice-extract/route.ts` (or `/api/documents/extract-invoice`).
  - Input: `file` + `module` (e.g. `ap-invoice` | `cb-pettycash`).
  - Output: structured payload for that module.
- **Document intelligence**: call Azure/Google/AWS from this API route (using env keys).
- **Shared component**: e.g. `InvoiceUploadDialog` (or `DocumentExtractDialog`) used on both AP Invoice and CB Petty Cash Main tabs; props: `module`, `onExtracted(data)`.
- **Pre-fill**: in AP Invoice page, `onExtracted` → set form values (header + `data_details`); same idea for CB Petty Cash.

No change to your existing ERP backend (e.g. `saveapinvoice`, etc.); extraction is only to **pre-fill** the form before user saves.

---

## 7. Questions for You

1. **Document intelligence**: Do you already have (or prefer) **Azure**, **Google**, or **AWS**? Or must it be **on-prem / no cloud** (then we’d consider Python + Tesseract)?
2. **Supplier matching**: Should we match extracted “vendor name” to your **supplier master** (e.g. by name/code) and pre-fill `supplierId`, or only pre-fill **supplier name** and let user select supplier from dropdown?
3. **GL mapping**: Do you have an existing **mapping table** (e.g. description/keyword → GL) in your backend/database, or should we define a **new** table/config (e.g. in this app or in ERP)?
4. **File after extract**: Should the uploaded file be **stored** as an attachment (e.g. linked to the document once saved), or only used for extraction and then discarded?
5. **Common screen**: Do you want the **common “Upload & Extract” screen** (dropdown) in **Phase 1**, or is per-screen upload enough for now?

---

## 8. Summary

| Topic | Suggestion |
|-------|------------|
| **Where to implement** | In this (Next.js) app first, using a **cloud document API** from an API route. Add Python later only if you need heavy custom ML or on-prem OCR. |
| **Upload UI** | **Per-screen**: separate “Upload invoice” on AP Invoice and “Upload invoice/receipt” on CB Petty Cash Main tabs; same backend extract API. Optionally add a common screen later. |
| **Flow** | Button → dialog → upload file → API extracts (OCR + mapping) → return DTO → pre-fill form (header + line items + GL). |
| **GL mapping** | Start with **rules or lookup table** in this app (or ERP); no Python required. |

Once you answer the questions in §7, the next step is to implement the **API route** and **shared upload dialog** and wire pre-fill for AP Invoice, then CB Petty Cash.
