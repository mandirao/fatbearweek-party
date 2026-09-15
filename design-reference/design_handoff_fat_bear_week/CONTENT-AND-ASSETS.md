# Content & Assets — Bear Guide

Companion to `UPDATE-3-bear-guide.md`. That document specifies the **design**; this one covers
the **content and the files it points at** — the data model, the images, and how the paths must
be wired so nothing breaks when this leaves the prototype.

## What ships

| Path | Count | Notes |
| --- | --- | --- |
| `bears-data.json` | 42 records | The content spec. Not a fixture — the real shape. |
| `photos/` | 91 JPEGs | 86 referenced by the data, 5 spare. 560–620px wide, q0.80–0.82. |

Two provenance groups, told apart by whether the record has a `page`:

- **`page` present** — 38 bears from the NPS photographic guide. Files named `p<page>_<n>.jpg`.
- **`page` null** — 4 bears from the NPS Fat Bear Week 2022 page, which also carry `credits`.
  Files named `nps2022_<bearnum>_<n>.jpg`.

The two groups need different credit lines. The design branches on `page` to pick one.

## Path wiring — read this before moving anything

Image paths inside `bears-data.json` are **document-relative**:

```json
"photos": ["photos/p19_1.jpg", "photos/p19_2.jpg"]
```

They resolve only when `photos/` is a sibling of the page that loads the data. Two more paths are
hardcoded in the page's `BRIEFS` constant rather than the data file: `photos/p4_1.jpg` (Brooks
Falls panorama) and `photos/p7_1.jpg` (brown bear intro).

**When you move these into a real asset pipeline**, do one of:

1. Rewrite the prefix at build time — strip `photos/` and map to your CDN or bundler URL.
2. Keep the bare filename in the data (`p19_1.jpg`) and resolve it in the view layer.
3. Replace the string with an imported asset reference per your framework's convention.

Do **not** leave the literal `photos/…` string in a component that renders from a different
route depth — that is the failure mode. Verified as shipped: all 78 referenced paths resolve
against this bundle, and the bundled copy of the page was opened in isolation to confirm the
images render.

**Filenames encode provenance.** `p<ebook page>_<n>.jpg` — `p19_1.jpg` is the first photograph on
page 19 of the source PDF, which is Otis's page. `nps2022_<num>_<n>.jpg` — `nps2022_128_1.jpg` is
Grazer's first (June) photo from the Fat Bear Week 2022 page. Preserve the names; they are how
anyone re-checks a photo against its source.

## Record shape

```jsonc
{
  "num": 480,                       // int, Park Service ID. Unique. Primary key.
  "name": "Otis",                   // "" when the bear has no nickname
  "cls": "Adult Male",              // Adult Male | Adult Female | Subadult Male | Subadult Female
  "page": 19,                       // ebook page, printed in the credit line. null when not in the book
  "photos": ["photos/p19_1.jpg",    // 0 or 2 entries. [0] = hero + thumb, [1] = secondary
             "photos/p19_2.jpg"],
  "spots": ["Jacuzzi", "Far Pool"], // fishing locations named in the text. May be []
  "since": "2001",                  // year first classified, when stated. Often null
  "note": "…",                      // one-sentence card summary
  "life": ["…"],                    // Life History paragraphs, verbatim
  "id":   ["…"],                    // ID Marks and Hints paragraphs, verbatim
  "tier": "current",                // current | guide | legacy | memorial
  "chip": null,                     // null | "LEGEND" | "IN MEMORIAM"
  "credits": ["June 24, 2022 · …"], // per-photo date + photographer. Only on the 4 FBW records
  "record": {                       // only on bears with Fat Bear Week history
    "badges": ["🏆 '14", "🏆 '16"],
    "line": "Four-time champ. Living legend.",
    "detail": ["…"]
  }
}
```

### Field notes

- **`photos`** is length 2 on all 42 records. The design still branches on missing photos
  (`photos[0]` missing → number watermark, `photos[1]` missing → no secondary figure) because
  bears added later may arrive without them. Keep those branches.
- **`credits`** exists only on the 4 Fat Bear Week records, where NPS credits each photo to a
  named photographer. Both entries are printed in that profile's credit line. Ebook photos carry
  no per-image credit — the document-level credit line covers them.
- **`spots`** is `[]` for four bears (814, 864, 435, 438) because the guide never names a
  location in their entries. The FISHES row hides rather than printing filler. Do not
  backfill with a generic string.
- **`note`** is the card line for ordinary bears. Bears with a `record` show `record.line`
  instead — the sports résumé beats the field note at card size.
- **`page`** is null on exactly the 4 Fat Bear Week records, and is what the credit line
  branches on. If you add a third source, give it an explicit source field rather than
  overloading `page` further.
- **`tier`** drives sort order and the quiet visual treatment. **`chip`** is independent of tier:
  LEGEND appears on four `legacy` bears, IN MEMORIAM on both `memorial` bears.
- **`record.badges`** contain emoji and typographic apostrophes (`🏆 '25`). They must render
  `white-space: nowrap` — without it the emoji and the year break across lines.

## Where the content came from

**38 bear profiles** — *Bears of Brooks River: A Photographic Guide to the Lives of Katmai's
Brown Bears*, National Park Service, Katmai National Park and Preserve; designed, written, and
edited by Michael Fitz. 49 pages. This is a 2009–2010 document: it predates Fat Bear Week
(started 2014) and contains nothing about the modern bracket cast.

**4 bear profiles** — the NPS Fat Bear Week 2022 page
(`nps.gov/katm/learn/fat-bear-week-2022.htm`) for 128 Grazer, 32 Chunk, 151 Walker, and 901,
none of whom appear in the ebook. Their `id` is that page's **Description** paragraph and their
`life` is its **Biography** paragraph, verbatim, with the page's own before/after photo pair.
Note NPS's caveat on that page: some images were mirrored for their comparison slider, so a
bear may face the opposite direction from other photos of it.

Both sources are NPS publications and therefore US Government works. The credit line on every
profile is not optional decoration — keep it, and keep it matched to the right source.

`life` and `id` are verbatim book text, cleaned only of PDF hyphenation (`habitu-\nated` →
`habituated`). No rewriting. Treat these as editorial content and store them where the app keeps
content, not inline in components.

**The Fat Bear Week records** (the `record` object) — supplied by the client from bracket
history for 8 bears: 128, 32, 901, 151, 856, 747, 435, 480. Not from either NPS source.
Everything else on those records comes from NPS; the `record` block does not.

**The briefings** — three collapsible cards condensed from ebook pages 3–7 (the river, the
quick-facts newsletter, the brown bear introduction). Currently a `BRIEFS` constant in the page.

## Known content gaps

1. **The four fbw2022 bears are four years stale.** Their text and photos are from the 2022
   season — Grazer's biography describes cubs she no longer has, and none of it reflects her
   2023/2024 championships. Refresh from Katmai's 2026 bracket post (September 18).
2. **Occasional PDF artifacts.** The book's two-column layout sometimes interleaved a photo
   caption into body text during extraction. 747's second paragraph is the known case; a
   proofread against the PDF before launch is cheap insurance.
3. **`since` is sparse.** Only present where the book states a classification year.
4. **Death vs. absence.** 219 One-toe and 402 are tiered `memorial`. Several others
   (6 Headbob, 247 Snaggletooth, 403 Egberta, 864 Norman) have text saying they stopped being
   seen around 2008–2010 — absence, not confirmed death, so they stay in `legacy`/`guide`.
   If the client has newer information, tier is the only field that needs to change.
5. **Every record is a snapshot, and they are not the same snapshot.** Ebook records are as of
   2009–2010; fbw2022 records are as of 2022. Ages, dominance rankings, and cub counts are all
   as-of-publication. "This year" inside a biography means that record's year, not 2026.

## If you re-extract from the PDF

Three image objects in the source are **empty photo frames**, not photographs — on pages 4, 39,
and 47. They are among the largest objects on their pages, so a naive "take the biggest image"
pass picks them and produces blank white heroes. Reject on average luminance (> 210) and dynamic
range (< 45) before accepting a candidate.
