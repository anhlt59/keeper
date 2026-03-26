# Project Changelog

Significant changes, features, and fixes are documented here.

---

## 2026-03-26

**Invoice ↔ Assets Relation & Invoice Detail Page Redesign**

- **Model**: `Invoice` model now tracks `assets[]` relation — assets created from an invoice are linked back to it for full procurement traceability.
- **UI**: Invoice detail page redesigned with Upload Invoice style: step indicator + Card shell layout for consistency.
- **DB Migration**: `add_invoice_assets_relation` — adds FK/relation between `invoices` and `assets` tables.

---

*Start of changelog — add new entries above, most recent first.*
