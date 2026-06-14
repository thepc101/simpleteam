export interface LawSection {
  heading: string
  points: string[]
}

export interface ComplianceItem {
  item: string
  cadence: string
}

export interface Law {
  id: string
  shortName: string
  title: string
  tag: string
  iconKey: 'receipt' | 'landmark' | 'building'
  accent: string // tailwind text/bg accent base, e.g. 'indigo'
  updated: string
  summary: string
  highlights: { label: string; value: string }[]
  sections: LawSection[]
  compliance: ComplianceItem[]
  resources: { label: string; url: string }[]
}

export const LAW_DISCLAIMER =
  'This reference is a plain-language summary for internal planning only. It is not legal, tax or accounting advice, may not reflect the latest amendments, and all figures (rates, thresholds, dates) are indicative. Always confirm with a qualified Chartered Accountant / Company Secretary and the official government sources before acting.'

export const LAWS: Law[] = [
  {
    id: 'gst',
    shortName: 'GST',
    title: 'Goods and Services Tax (GST)',
    tag: 'Indirect Tax',
    iconKey: 'receipt',
    accent: 'violet',
    updated: 'Reviewed Jun 2025',
    summary:
      "India's unified indirect tax on the supply of goods and services, in force since 1 July 2017. It replaced a patchwork of central and state levies (excise, service tax, VAT, etc.) with a single, destination-based, multi-stage tax that allows input-tax credit across the supply chain.",
    highlights: [
      { label: 'In force since', value: '1 July 2017' },
      { label: 'Structure', value: 'CGST + SGST / IGST' },
      { label: 'Rate reform', value: '2-slab from 22 Sep 2025' },
      { label: 'Reg. threshold', value: '₹40L goods / ₹20L services' },
    ],
    sections: [
      {
        heading: 'Structure',
        points: [
          'Dual GST: CGST + SGST on intra-state supply, IGST on inter-state supply, UTGST in union territories.',
          'Destination-based and multi-stage, with input-tax credit (ITC) flowing through the chain.',
          'Administered online through the GSTN portal (returns, payments, e-invoicing, e-way bills).',
        ],
      },
      {
        heading: 'Tax rates (post Sept-2025 rationalisation)',
        points: [
          'Two principal slabs: 5% (merit) and 18% (standard).',
          'A 40% special rate applies to select luxury / sin goods (e.g. tobacco, aerated drinks, high-end vehicles).',
          'Essentials remain 0% / exempt; the earlier 12% and 28% slabs were largely merged into 5% and 18%.',
          'Rates are indicative — confirm the HSN/SAC-specific rate for each product or service.',
        ],
      },
      {
        heading: 'Registration',
        points: [
          'Mandatory above turnover thresholds: ₹40L for goods, ₹20L for services (₹20L / ₹10L for special-category states).',
          'Compulsory regardless of turnover for inter-state suppliers, e-commerce operators, casual / non-resident taxable persons and reverse-charge payers.',
          'GSTIN is a 15-character PAN-based identifier; voluntary registration is allowed.',
        ],
      },
      {
        heading: 'Input Tax Credit (ITC)',
        points: [
          'GST paid on business inputs and services can be set off against output tax liability.',
          'Conditions: valid tax invoice, goods/services actually received, supplier has filed and the credit appears in GSTR-2B, and the recipient has filed returns.',
          'Some credits are blocked under Sec 17(5) (e.g. personal use, certain motor vehicles, club memberships).',
        ],
      },
      {
        heading: 'Composition scheme (small taxpayers)',
        points: [
          'For turnover up to ₹1.5 crore (₹75L in special-category states); ₹50L sub-limit for eligible services.',
          'Flat rate — 1% (traders/manufacturers), 5% (restaurants), 6% (eligible services).',
          'Cannot collect GST from customers or claim ITC; quarterly payment via CMP-08 and annual GSTR-4.',
        ],
      },
      {
        heading: 'Returns & e-compliance',
        points: [
          'GSTR-1 (outward supplies), GSTR-3B (summary + tax payment), GSTR-9 (annual), GSTR-9C (reconciliation, turnover > ₹5 cr).',
          'QRMP scheme lets taxpayers below ₹5 cr file quarterly while paying tax monthly.',
          'E-invoicing is mandatory above the notified turnover; an e-way bill is needed for goods movement over ₹50,000.',
        ],
      },
    ],
    compliance: [
      { item: 'GSTR-1 (outward supplies)', cadence: 'Monthly 11th / Quarterly (QRMP)' },
      { item: 'GSTR-3B (summary & payment)', cadence: 'Monthly 20th / Quarterly 22nd–24th' },
      { item: 'CMP-08 (composition payment)', cadence: 'Quarterly, 18th' },
      { item: 'GSTR-9 (annual return)', cadence: 'Annually, 31 Dec of next FY' },
    ],
    resources: [
      { label: 'GST Portal', url: 'https://www.gst.gov.in' },
      { label: 'CBIC-GST', url: 'https://cbic-gst.gov.in' },
    ],
  },
  {
    id: 'income-tax-2025',
    shortName: 'Income Tax 2025',
    title: 'The Income-tax Act, 2025',
    tag: 'Direct Tax',
    iconKey: 'landmark',
    accent: 'emerald',
    updated: 'Reviewed Jun 2025',
    summary:
      'The new direct-tax code replacing the Income-tax Act, 1961. Effective 1 April 2026 (tax year 2026-27 onward), it restructures and simplifies the law — fewer sections, plain-language drafting, and a single unified "Tax Year" replacing the old "previous year / assessment year" split — without overhauling core tax policy.',
    highlights: [
      { label: 'Replaces', value: 'Income-tax Act, 1961' },
      { label: 'Effective', value: '1 April 2026' },
      { label: 'Key change', value: 'Single "Tax Year"' },
      { label: 'Default', value: 'New regime' },
    ],
    sections: [
      {
        heading: 'Why a new Act',
        points: [
          'The 1961 Act had grown to 800+ sections with heavy cross-referencing.',
          'The 2025 Act consolidates this into roughly 536 sections / 23 chapters using tables and plain language.',
          'Intent is simplification and readability — core tax policy and most established interpretations are retained.',
        ],
      },
      {
        heading: 'The "Tax Year" concept',
        points: [
          'Replaces the dual "previous year" + "assessment year" terminology with one "Tax Year".',
          'The Tax Year is the 12-month financial year in which income is earned and taxed.',
          'Reduces ambiguity in filings, notices and reconciliations.',
        ],
      },
      {
        heading: 'Personal tax — new regime (default)',
        points: [
          'New/concessional regime is the default; indicative slabs: up to ₹4L nil, ₹4–8L 5%, ₹8–12L 10%, ₹12–16L 15%, ₹16–20L 20%, ₹20–24L 25%, above ₹24L 30%.',
          'Standard deduction of ₹75,000 for salaried taxpayers.',
          'A Sec 87A rebate makes normal income up to ₹12L effectively tax-free.',
          'The old regime (with deductions like 80C / 80D / HRA) remains available on opt-in.',
        ],
      },
      {
        heading: 'Corporate & business tax',
        points: [
          'Domestic companies: 22% concessional rate without specified deductions; 15% for eligible new manufacturing companies.',
          'Otherwise 25% (turnover up to the notified limit) or 30%, plus surcharge and 4% health & education cess.',
          'MAT/AMT, set-off and carry-forward provisions are retained.',
        ],
      },
      {
        heading: 'TDS / TCS & advance tax',
        points: [
          'Tax deduction/collection at source provisions are retained and re-tabulated for clarity.',
          'Advance tax in four instalments: 15 Jun, 15 Sep, 15 Dec, 15 Mar.',
          'Annual ITR filing with due dates by taxpayer category.',
        ],
      },
      {
        heading: 'What it means for a company',
        points: [
          'Update payroll and TDS systems to the new section references.',
          'Re-paper tax workings around the "Tax Year".',
          'Confirm each employee’s regime choice; tax-audit (Sec 44AB equivalent) obligations continue.',
        ],
      },
    ],
    compliance: [
      { item: 'Advance tax instalments', cadence: 'Quarterly — 15 Jun/Sep/Dec/Mar' },
      { item: 'TDS payment', cadence: 'Monthly, by the 7th' },
      { item: 'TDS returns (24Q / 26Q)', cadence: 'Quarterly' },
      { item: 'ITR filing', cadence: 'Annually — 31 Jul / 31 Oct (audited)' },
    ],
    resources: [{ label: 'Income Tax Department', url: 'https://www.incometax.gov.in' }],
  },
  {
    id: 'companies-act-small',
    shortName: 'Companies Act',
    title: 'Companies Act, 2013 — Small Company',
    tag: 'Corporate Law',
    iconKey: 'building',
    accent: 'sky',
    updated: 'Reviewed Jun 2025',
    summary:
      'The Companies Act, 2013 governs incorporation, governance and compliance of companies in India. A "Small Company" (Sec 2(85)) is a private company below prescribed capital and turnover limits, and gets a lighter compliance regime — fewer board meetings, simpler reports and reduced penalties — so small businesses are not burdened like large corporates.',
    highlights: [
      { label: 'Definition', value: 'Section 2(85)' },
      { label: 'Paid-up capital', value: '≤ ₹4 crore' },
      { label: 'Turnover', value: '≤ ₹40 crore' },
      { label: 'Board meetings', value: 'Only 2 / year' },
    ],
    sections: [
      {
        heading: 'What is a "Small Company"',
        points: [
          'A company (other than a public company) meeting BOTH limits: paid-up share capital ≤ ₹4 crore AND turnover ≤ ₹40 crore.',
          'Limits are set by the Companies (Specification of Definitions Details) Amendment Rules, 2022.',
          'Thresholds were progressively raised from the original ₹50 lakh / ₹2 crore.',
        ],
      },
      {
        heading: 'Who cannot be a small company',
        points: [
          'A public company.',
          'A holding company or a subsidiary company.',
          'A company registered under Section 8 (not-for-profit).',
          'A company or body corporate governed by any special Act — none qualify even if within the limits.',
        ],
      },
      {
        heading: 'Relaxations & benefits',
        points: [
          'Only 2 board meetings per financial year (one per half, min 90 days apart) instead of 4.',
          'Cash flow statement is not mandatory in the financial statements.',
          'Abridged board’s report; annual return may be signed by a director where there is no company secretary.',
          'Auditor rotation (Sec 139(2)) does not apply; reduced (roughly half) penalties under Sec 446B.',
          'Fast-track merger route (Sec 233) available between small companies.',
        ],
      },
      {
        heading: 'Ongoing compliance (still required)',
        points: [
          'Statutory audit of accounts every year.',
          'Annual filing: AOC-4 (financial statements) and MGT-7A (abridged annual return for small companies / OPC).',
          'Hold an AGM; maintain statutory registers and minutes.',
          'Director DIR-3 KYC annually; board report and disclosure of interest.',
          'Income-tax and GST obligations apply separately.',
        ],
      },
      {
        heading: 'Why it matters here',
        points: [
          'Map filings (AOC-4, MGT-7A, DIR-3 KYC) to recurring tasks and deadlines in SimpleTeam.',
          'The lighter cadence (2 board meetings) simplifies scheduling.',
          'Watch the ₹4 cr / ₹40 cr ceilings — crossing them changes the compliance class.',
        ],
      },
    ],
    compliance: [
      { item: 'Board meetings', cadence: 'At least 2 per financial year' },
      { item: 'AOC-4 (financial statements)', cadence: 'Within 30 days of AGM' },
      { item: 'MGT-7A (annual return)', cadence: 'Within 60 days of AGM' },
      { item: 'DIR-3 KYC (directors)', cadence: 'Annually, by 30 Sep' },
    ],
    resources: [{ label: 'Ministry of Corporate Affairs', url: 'https://www.mca.gov.in' }],
  },
]
