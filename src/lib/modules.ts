export type ModuleStatus = 'live' | 'soon'

export interface AppModule {
  key: string
  title: string
  desc: string
  icon: string
  status: ModuleStatus
  href?: string
}

export const MODULE_GROUPS: { label: string; items: AppModule[] }[] = [
  {
    label: 'Live now',
    items: [
      { key: 'practice', title: 'Practice Management', desc: 'Automate workflows, manage your team and track every compliance from one dashboard.', icon: 'Briefcase', status: 'live', href: '/dashboard' },
      { key: 'clients', title: 'Client Management', desc: 'A complete client directory — entity type, GSTIN/PAN, contacts and relationship owners.', icon: 'Building2', status: 'live', href: '/clients' },
      { key: 'calendar', title: 'Compliance Calendar', desc: 'Every GST, ITR, TDS and ROC due date for every client, in one month view.', icon: 'CalendarDays', status: 'live', href: '/calendar' },
      { key: 'whatsapp', title: 'WhatsApp Automation', desc: 'Auto-notify clients on filings & due dates — fully editable, sent from your business number.', icon: 'MessageCircle', status: 'live', href: '/whatsapp' },
      { key: 'chat', title: 'Team Chat', desc: 'Real-time team messaging and direct messages, built in.', icon: 'MessagesSquare', status: 'live', href: '/chat' },
      { key: 'laws', title: 'Compliance Reference', desc: 'Plain-language GST, Income-tax Act 2025 and Companies Act references at hand.', icon: 'Scale', status: 'live', href: '/laws' },
    ],
  },
  {
    label: 'On the roadmap',
    items: [
      { key: 'cloud-accounting', title: 'Cloud Accounting', desc: 'Secure, real-time accounting with automated reports and multi-branch access.', icon: 'Cloud', status: 'soon' },
      { key: 'gst-filing', title: 'GST Filing', desc: 'File GSTRs in clicks, reconcile ITC and automate reminders.', icon: 'Receipt', status: 'soon' },
      { key: 'gst-billing', title: 'GST Billing & Invoicing', desc: 'GST-compliant invoices, multi-firm billing and payment tracking.', icon: 'FileText', status: 'soon' },
      { key: 'e-invoicing', title: 'E-Invoicing', desc: 'IRN-verified invoices with QR codes and auto GST-portal sync.', icon: 'QrCode', status: 'soon' },
      { key: 'eway', title: 'E-Way Bill', desc: 'Generate e-way bills — fast, compliant and error-free.', icon: 'Truck', status: 'soon' },
      { key: 'inventory', title: 'Inventory Management', desc: 'Track stock levels, automate reorders and manage multi-branch inventory.', icon: 'Boxes', status: 'soon' },
      { key: 'ecommerce', title: 'E-Commerce Accounting', desc: 'Sync orders and reconcile across Amazon, Flipkart, Meesho and Shopify.', icon: 'ShoppingCart', status: 'soon' },
      { key: 'multi-branch', title: 'Multi-Branch Reports', desc: 'Branch-wise and consolidated reports with real-time dashboards.', icon: 'Network', status: 'soon' },
      { key: 'audit-ai', title: 'Audit AI', desc: 'Import data, generate audit reports and ensure tamper-proof financial trails.', icon: 'ShieldCheck', status: 'soon' },
      { key: 'cma-ai', title: 'CMA Report AI', desc: 'Create CMA reports with projections, ratios and loan-eligibility insights.', icon: 'FileChartColumn', status: 'soon' },
      { key: 'retail-loans', title: 'Retail Loans', desc: 'Track loan applications, manage borrowers and surface insights instantly.', icon: 'Landmark', status: 'soon' },
      { key: 'documents', title: 'Document Management', desc: 'Organise and manage client documents with WhatsApp-driven collection.', icon: 'FolderOpen', status: 'soon' },
    ],
  },
]
