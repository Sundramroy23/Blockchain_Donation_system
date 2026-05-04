// src/router/routes.js
// Single source of truth for all routes.
// Each entry declares: path, label, sidebar icon, and which roles can access it.

export const ROLES_META = [
  { id: "govAdmin", label: "Gov Admin", org: "Org2 · Government", color: "#60a5fa" },
  { id: "govUser",  label: "Gov User",  org: "Org2 · Government", color: "#93c5fd" },
  { id: "bankUser", label: "Bank User", org: "Org2 · Government", color: "#2dd4bf" },
  { id: "donor",    label: "Donor",     org: "Org2 · Government", color: "#4ade80" },
  { id: "ngoAdmin", label: "NGO Admin", org: "Org3 · NGO",        color: "#a78bfa" },
  { id: "ngoUser",  label: "NGO User",  org: "Org3 · NGO",        color: "#a78bfa" },
];

export const ROUTES = [
  // ── Shared ────────────────────────────────────────────────────────────────
  {
    path:  "/dashboard",
    label: "Dashboard",
    icon:  "◈",
    roles: ["govAdmin","govUser","bankUser","donor","ngoAdmin","ngoUser"],
  },

  // ── Org2 / govAdmin ───────────────────────────────────────────────────────
  { path: "/gov/register-donor",    label: "Register Donor",    icon: "⊕", roles: ["govAdmin"] },
  { path: "/gov/register-bank",     label: "Register Bank",     icon: "⊕", roles: ["govAdmin"] },
  { path: "/gov/register-gov-user", label: "Register Gov User", icon: "⊕", roles: ["govAdmin"] },
  { path: "/gov/donors",            label: "All Donors",        icon: "◉", roles: ["govAdmin","govUser"] },
  { path: "/gov/banks",             label: "All Banks",         icon: "◉", roles: ["govAdmin","govUser"] },
  { path: "/gov/ngos",              label: "All NGOs",          icon: "◉", roles: ["govAdmin","govUser"] },
  { path: "/gov/donations-query",   label: "Donations Query",   icon: "◈", roles: ["govAdmin","govUser"] },

  // ── Org2 / bankUser ───────────────────────────────────────────────────────
  { path: "/bank/issue-tokens", label: "Issue Tokens",   icon: "◈", roles: ["bankUser"] },
  { path: "/bank/transfer",     label: "Transfer Tokens",icon: "⇄", roles: ["bankUser"] },

  // ── Org2 / donor ──────────────────────────────────────────────────────────
  { path: "/donor/donate", label: "Donate",          icon: "♡", roles: ["donor"] },
  { path: "/donor/funds",  label: "Available Funds", icon: "◉", roles: ["donor"] },

  // ── Org3 / ngoAdmin ───────────────────────────────────────────────────────
  { path: "/ngo/register", label: "Register NGO", icon: "⊕", roles: ["ngoAdmin"] },
  { path: "/ngo/detail",   label: "NGO Details",  icon: "◈", roles: ["ngoAdmin","ngoUser"] },

  // ── Org3 / ngoUser ────────────────────────────────────────────────────────
  { path: "/ngo/create-fund",  label: "Create Fund",    icon: "⊕", roles: ["ngoUser"] },
  { path: "/ngo/my-funds",     label: "My Funds",       icon: "◉", roles: ["ngoUser"] },
  { path: "/ngo/add-expense",  label: "Add Expense",    icon: "⊕", roles: ["ngoUser"] },
  { path: "/ngo/list-funds",   label: "Funds by NGO",   icon: "◉", roles: ["ngoUser"] },
  { path: "/ngo/redeem",       label: "Redeem Tokens",  icon: "◈", roles: ["ngoUser"] },
];
