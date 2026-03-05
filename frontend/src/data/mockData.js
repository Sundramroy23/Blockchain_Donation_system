// src/data/mockData.js

export const donors = [
  { id: "DNR001", name: "Alice Johnson", email: "alice@example.com", wallet: "0xABC1...", tokens: 2400, org: "GovMSP" },
  { id: "DNR002", name: "Bob Chen",      email: "bob@example.com",   wallet: "0xDEF2...", tokens: 1800, org: "GovMSP" },
  { id: "DNR003", name: "Carol Smith",   email: "carol@example.com", wallet: "0xGHI3...", tokens: 3200, org: "GovMSP" },
];

export const banks = [
  { id: "BNK001", name: "First National",    country: "US", address: "0xBANK1...", issued: 50000, circulating: 42000 },
  { id: "BNK002", name: "City Credit Union", country: "UK", address: "0xBANK2...", issued: 30000, circulating: 28500 },
];

export const ngos = [
  { id: "NGO001", name: "Green Earth Foundation", focus: "Environment", admin: "ngo@green.org",    verified: true,  funds: 3 },
  { id: "NGO002", name: "Children First",          focus: "Education",   admin: "admin@cfirst.org", verified: true,  funds: 2 },
  { id: "NGO003", name: "HealthBridge",            focus: "Healthcare",  admin: "ops@hbridge.org",  verified: false, funds: 1 },
];

export const funds = [
  { id: "FND001", name: "Amazon Reforestation 2025", ngo: "NGO001", target: 10000, raised: 7240, status: "open",   donors: 48, created: "2025-01-10" },
  { id: "FND002", name: "School Books Drive",         ngo: "NGO002", target: 5000,  raised: 5000, status: "closed", donors: 31, created: "2024-11-15" },
  { id: "FND003", name: "Rural Clinic Equipment",     ngo: "NGO003", target: 15000, raised: 3100, status: "open",   donors: 12, created: "2025-02-20" },
  { id: "FND004", name: "Urban Garden Initiative",    ngo: "NGO001", target: 8000,  raised: 2400, status: "open",   donors: 19, created: "2025-03-01" },
];

export const donations = [
  { id: "DON001", donor: "DNR001", fund: "FND001", amount: 500, date: "2025-02-14", tx: "0xTX001..." },
  { id: "DON002", donor: "DNR002", fund: "FND003", amount: 300, date: "2025-02-18", tx: "0xTX002..." },
  { id: "DON003", donor: "DNR001", fund: "FND004", amount: 200, date: "2025-02-28", tx: "0xTX003..." },
];

export const orgs = [
  { id: "ORG001", name: "PlatformMSP", type: "Platform",   status: "active" },
  { id: "ORG002", name: "GovMSP",      type: "Government", status: "active" },
  { id: "ORG003", name: "NGOMSP",      type: "NGO",        status: "active" },
];

export const expenses = [
  { id: "EXP001", fund: "FND001", description: "Seedling purchase", amount: 1200, date: "2025-02-01", status: "approved" },
  { id: "EXP002", fund: "FND001", description: "Land preparation",  amount: 800,  date: "2025-02-15", status: "pending"  },
];
