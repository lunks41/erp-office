# Telerik Report: Navigation URL Expression

## How the app opens a transaction by document

All AR transaction pages (invoice, receipt, credit note, etc.) support opening a specific document via the **query parameter**:

- **URL format:** `{origin}/{companyId}/ar/{transaction}?docId={value}`
- **`docId` value:** The app accepts **either**:
  - **Document ID** (numeric primary key), e.g. `123`, or
  - **Document number** (display number), e.g. `INV-001`, `RCP-002`

So you can use either `Fields.DocumentId` or `Fields.DocumentNo` in the report, depending on what your report dataset exposes. Prefer `DocumentId` when available (more reliable for loading).

**Example URLs:**

- Open invoice by ID: `https://yourapp.com/5/ar/invoice?docId=123`
- Open invoice by number: `https://yourapp.com/5/ar/invoice?docId=INV-001`
- Open receipt: `https://yourapp.com/5/ar/receipt?docId=456`

---

## Corrected Telerik expression (AR Module, with docId)

Use this in the report item’s **Navigation URL** (or hyperlink) so that when `ModuleId = 25` (AR) the link goes to the right transaction with `?docId=` set.

**Report input parameters (must exist in the report):**

- `url` – base URL (e.g. `https://yourapp.com`), passed from the AR reports page
- `companyId` – company id
- (Others used by the report: `amtDec`, `asOfDate`, `companyName`, `currencyId`, `customerId`, `fromDate`, `locAmtDec`, `reportType`, `toDate`, `userName`)

**Report fields (from dataset):** `ModuleId`, `TransactionId`, `DocumentId` (or `DocumentNo`)

**Expression (VB-style, `&` for concatenation):**  
Use the same parameter casing as in your report. If your parameters are lowercase (`url`, `companyId`), use `Parameters.url.Value` and `Parameters.companyId.Value`:

```text
= IIf(Fields.ModuleId = 25,
  Parameters.url.Value & "/" & CStr(Parameters.companyId.Value) &
  IIf(Fields.TransactionId = 1, "/ar/invoice?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 2, "/ar/debitnote?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 3, "/ar/creditnote?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 4, "/ar/adjustment?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 5, "/ar/receipt?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 6, "/ar/refund?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 7, "/ar/docsetoff?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 9, "/ar/invoicectm?docId=" & CStr(Fields.DocumentId),
  IIf(Fields.TransactionId = 11, "/ar/receiptmulticurrency?docId=" & CStr(Fields.DocumentId),
  ""))))))))),
  "")
```

If your report defines parameters with different casing (e.g. `Url`, `CompanyId`), use `Parameters.Url.Value` and `Parameters.CompanyId.Value` instead.

**TransactionId → path mapping (AR):**

| TransactionId | Path                         |
|---------------|------------------------------|
| 1             | /ar/invoice                  |
| 2             | /ar/debitnote                |
| 3             | /ar/creditnote                |
| 4             | /ar/adjustment                |
| 5             | /ar/receipt                  |
| 6             | /ar/refund                   |
| 7             | /ar/docsetoff                |
| 9             | /ar/invoicectm               |
| 11            | /ar/receiptmulticurrency     |

---

## What was wrong in the original expression

1. **Missing `companyId` in the URL**  
   The app route is `/{companyId}/ar/...`, so the link must be  
   `Parameters.url.Value & "/" & CStr(Parameters.companyId.Value) & "/ar/..."`

2. **Syntax errors**
   - Missing comma after `"/ar/refund"` before the next `IIf`.
   - Mismatched parentheses (one extra `)` and one missing `,` in the nested `IIf`s).

3. **No way to open a specific document**  
   The path alone opens the list/form; adding **`?docId=`** plus `Fields.DocumentId` (or `Fields.DocumentNo`) makes the app open that invoice/receipt/etc.

4. **Missing transaction types**  
   Added: `7` = docsetoff, `9` = invoicectm, and kept `11` = receiptmulticurrency.

---

## Using DocumentNo instead of DocumentId

If your report has only a document number (e.g. `Fields.DocumentNo`), use it in the query string:

```text
"?docId=" & CStr(Fields.DocumentNo)
```

Replace the `CStr(Fields.DocumentId)` part in the expression above with `CStr(Fields.DocumentNo)` (and handle null/empty if needed). The app accepts both ID and number for `docId`.

---

## Null-safe variant (when DocumentId can be null)

If `Fields.DocumentId` can be null and you want to avoid "?docId=" with no value:

```text
= IIf(Fields.ModuleId = 25,
  Parameters.url.Value & "/" & CStr(Parameters.companyId.Value) &
  IIf(Fields.TransactionId = 1, "/ar/invoice" & IIf(Fields.DocumentId Is Nothing, "", "?docId=" & CStr(Fields.DocumentId)),
  IIf(Fields.TransactionId = 2, "/ar/debitnote" & IIf(Fields.DocumentId Is Nothing, "", "?docId=" & CStr(Fields.DocumentId)),
  ... same for 3,4,5,6,7,9,11 ...
  ""))))))))),
  "")
```

Or keep the simpler version; the app will just load the transaction screen without a pre-selected document when `docId` is empty.

---

## Combined expression: AR (25), AP (26), CB (27), GL (28)

Use this **single expression** when your report dataset can contain rows from multiple modules (e.g. GL ledger with links to AR, AP, CB, and GL transactions). It uses `IsNull(Fields.ModuleId, 0)` and `IsNull(Fields.TransactionId, 0)` for null safety.

**ModuleId:** 25 = AR, 26 = AP, 27 = CB, 28 = GL

**Parameters:** `url`, `companyId` (same as above)

**Copy-paste (single line or multi-line in Telerik):**

```text
= IIf(IsNull(Fields.ModuleId, 0) = 25,
    Parameters.url.Value + "/" + CStr(Parameters.companyId.Value) +
    IIf(IsNull(Fields.TransactionId, 0) = 1, "/ar/invoice?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 2, "/ar/debitnote?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 3, "/ar/creditnote?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 4, "/ar/adjustment?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 5, "/ar/receipt?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 6, "/ar/refund?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 7, "/ar/docsetoff?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 9, "/ar/invoicectm?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 11, "/ar/receiptmulticurrency?docId=" + CStr(Fields.DocumentId),
    ""))))))))),
IIf(IsNull(Fields.ModuleId, 0) = 26,
    Parameters.url.Value + "/" + CStr(Parameters.companyId.Value) +
    IIf(IsNull(Fields.TransactionId, 0) = 1, "/ap/invoice?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 2, "/ap/debitnote?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 3, "/ap/creditnote?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 4, "/ap/adjustment?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 5, "/ap/payment?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 6, "/ap/refund?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 7, "/ap/docsetoff?docId=" + CStr(Fields.DocumentId),
    ""))))))),
IIf(IsNull(Fields.ModuleId, 0) = 27,
    Parameters.url.Value + "/" + CStr(Parameters.companyId.Value) +
    IIf(IsNull(Fields.TransactionId, 0) = 1, "/cb/cbgenreceipt?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 2, "/cb/cbgenpayment?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 3, "/cb/cbpettycash?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 4, "/cb/cbbanktransfer?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 5, "/cb/cbbankrecon?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 6, "/cb/cbbanktransferctm?docId=" + CStr(Fields.DocumentId),
    ""))))))),
IIf(IsNull(Fields.ModuleId, 0) = 28,
    Parameters.url.Value + "/" + CStr(Parameters.companyId.Value) +
    IIf(IsNull(Fields.TransactionId, 0) = 1, "/gl/journalentry?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 2, "/gl/arapcontra?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 3, "/gl/openingbalance?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 4, "/gl/yearendprocess?docId=" + CStr(Fields.DocumentId),
    IIf(IsNull(Fields.TransactionId, 0) = 5, "/gl/periodclose?docId=" + CStr(Fields.DocumentId),
    "")))))),
""))))
```

**TransactionId → path reference**

| ModuleId | Module | TransactionId | Path |
|----------|--------|---------------|------|
| 25 | AR | 1 | /ar/invoice |
| 25 | AR | 2 | /ar/debitnote |
| 25 | AR | 3 | /ar/creditnote |
| 25 | AR | 4 | /ar/adjustment |
| 25 | AR | 5 | /ar/receipt |
| 25 | AR | 6 | /ar/refund |
| 25 | AR | 7 | /ar/docsetoff |
| 25 | AR | 9 | /ar/invoicectm |
| 25 | AR | 11 | /ar/receiptmulticurrency |
| 26 | AP | 1 | /ap/invoice |
| 26 | AP | 2 | /ap/debitnote |
| 26 | AP | 3 | /ap/creditnote |
| 26 | AP | 4 | /ap/adjustment |
| 26 | AP | 5 | /ap/payment |
| 26 | AP | 6 | /ap/refund |
| 26 | AP | 7 | /ap/docsetoff |
| 27 | CB | 1 | /cb/cbgenreceipt |
| 27 | CB | 2 | /cb/cbgenpayment |
| 27 | CB | 3 | /cb/cbpettycash |
| 27 | CB | 4 | /cb/cbbanktransfer |
| 27 | CB | 5 | /cb/cbbankrecon |
| 27 | CB | 6 | /cb/cbbanktransferctm |
| 28 | GL | 1 | /gl/journalentry |
| 28 | GL | 2 | /gl/arapcontra |
| 28 | GL | 3 | /gl/openingbalance |
| 28 | GL | 4 | /gl/yearendprocess |
| 28 | GL | 5 | /gl/periodclose |

If a GL report only uses ledger documents (journal entry, AR/AP contra), you can shorten the GL block to just TransactionId 1 and 2; remove the IIf for 3, 4, 5 if those screens do not use `docId`.
