# ChainDonate — Codebase Structure

## Quick Start
```bash
cd chaindonate
npm install
npm start
```

---

## Full File Tree

```
chaindonate/
├── public/
│   └── index.html                         # HTML shell
│
├── src/
│   ├── index.js                           # React DOM entry point
│   ├── App.jsx                            # Root: providers + BrowserRouter
│   │
│   ├── styles/
│   │   ├── tokens.css                     # CSS variables (colors, spacing, fonts)
│   │   └── components.css                 # All global component styles + responsive
│   │
│   ├── context/
│   │   ├── AuthContext.jsx                # user state, login(), logout()
│   │   └── ToastContext.jsx               # push(msg, type) toast notifications
│   │
│   ├── data/
│   │   └── mockData.js                    # donors, banks, ngos, funds, donations, orgs, expenses
│   │
│   ├── router/
│   │   ├── routes.js                      # ROUTES[] + ROLES_META[] — single source of truth
│   │   ├── ProtectedRoute.jsx             # Auth guard + role guard wrapper
│   │   └── AppRouter.jsx                  # <Routes> mapping every path → page component
│   │
│   ├── layout/
│   │   └── AppShell.jsx                   # Sidebar + Topbar shell (wraps all protected pages)
│   │
│   ├── components/
│   │   └── shared/
│   │       ├── Badge.jsx                  # Colored status badge
│   │       ├── PageHeader.jsx             # Page title + description + optional action
│   │       └── DataTable.jsx              # Reusable table with empty state
│   │
│   └── pages/
│       ├── login/
│       │   └── LoginPage.jsx              # Two-panel login with role selector
│       │
│       ├── shared/
│       │   └── DashboardPage.jsx          # Role-aware dashboard (all 7 roles)
│       │
│       ├── admin/                         # Org1 — PlatformMSP
│       │   ├── AddOrgPage.jsx             # Add new organization to network
│       │   └── OrgsPage.jsx               # List all organizations
│       │
│       ├── gov/                           # Org2 — GovMSP
│       │   ├── RegisterDonorPage.jsx      # govAdmin: register a donor
│       │   ├── RegisterBankPage.jsx       # govAdmin: register a bank
│       │   ├── DonorsPage.jsx             # govAdmin + govUser: view all donors
│       │   ├── BanksPage.jsx              # govAdmin + govUser: view all banks
│       │   ├── NGOsPage.jsx               # govAdmin + govUser: view all NGOs
│       │   └── DonationsQueryPage.jsx     # govAdmin: query donations by donor
│       │
│       ├── bank/                          # Org2 — bankUser
│       │   ├── IssueTokensPage.jsx        # Mint new tokens
│       │   └── TransferPage.jsx           # Transfer tokens between wallets
│       │
│       ├── donor/                         # Org2 — donor
│       │   ├── DonatePage.jsx             # Browse funds + donate tokens
│       │   └── FundsPage.jsx              # View all open funds
│       │
│       └── ngo/
│           ├── admin/                     # Org3 — ngoAdmin
│           │   ├── RegisterPage.jsx       # Register a new NGO
│           │   └── DetailPage.jsx         # View NGO details + fund summary
│           │
│           └── user/                      # Org3 — ngoUser
│               ├── CreateFundPage.jsx     # Create a new fundraising campaign
│               ├── MyFundsPage.jsx        # View + close my funds
│               ├── AddExpensePage.jsx     # Record a fund expense
│               ├── ListFundsPage.jsx      # List all funds (filtered by status)
│               └── RedeemPage.jsx         # Redeem tokens via bank
│
└── package.json
```

---

## Routing Map

| Path                    | Page Component           | Allowed Roles                        |
|-------------------------|--------------------------|--------------------------------------|
| `/login`                | `LoginPage`              | Public                               |
| `/dashboard`            | `DashboardPage`          | All roles                            |
| `/admin/add-org`        | `AddOrgPage`             | `admin`                              |
| `/admin/orgs`           | `OrgsPage`               | `admin`                              |
| `/gov/register-donor`   | `RegisterDonorPage`      | `govAdmin`                           |
| `/gov/register-bank`    | `RegisterBankPage`       | `govAdmin`                           |
| `/gov/donors`           | `DonorsPage`             | `govAdmin`, `govUser`                |
| `/gov/banks`            | `BanksPage`              | `govAdmin`, `govUser`                |
| `/gov/ngos`             | `NGOsPage`               | `govAdmin`, `govUser`                |
| `/gov/donations-query`  | `DonationsQueryPage`     | `govAdmin`                           |
| `/bank/issue-tokens`    | `IssueTokensPage`        | `bankUser`                           |
| `/bank/transfer`        | `TransferPage`           | `bankUser`                           |
| `/donor/donate`         | `DonatePage`             | `donor`                              |
| `/donor/funds`          | `FundsPage`              | `donor`                              |
| `/ngo/register`         | `RegisterPage` (admin)   | `ngoAdmin`                           |
| `/ngo/detail`           | `DetailPage` (admin)     | `ngoAdmin`                           |
| `/ngo/create-fund`      | `CreateFundPage`         | `ngoUser`                            |
| `/ngo/my-funds`         | `MyFundsPage`            | `ngoUser`                            |
| `/ngo/add-expense`      | `AddExpensePage`         | `ngoUser`                            |
| `/ngo/list-funds`       | `ListFundsPage`          | `ngoUser`                            |
| `/ngo/redeem`           | `RedeemPage`             | `ngoUser`                            |

---

## Role → Pages Reference

| Role       | Org           | Accessible Pages                                                                 |
|------------|---------------|---------------------------------------------------------------------------------|
| `admin`    | Org1/Platform | Dashboard, Add Org, Orgs List                                                   |
| `govAdmin` | Org2/Gov      | Dashboard, Register Donor, Register Bank, All Donors, All Banks, All NGOs, Donations Query |
| `govUser`  | Org2/Gov      | Dashboard, All Donors, All Banks, All NGOs                                      |
| `bankUser` | Org2/Gov      | Dashboard, Issue Tokens, Transfer Tokens                                        |
| `donor`    | Org2/Gov      | Dashboard, Donate, Available Funds                                              |
| `ngoAdmin` | Org3/NGO      | Dashboard, Register NGO, NGO Details                                            |
| `ngoUser`  | Org3/NGO      | Dashboard, Create Fund, My Funds, Add Expense, Funds by NGO, Redeem Tokens     |

---

## Key Architecture Decisions

### Auth Flow
1. User selects a role on `LoginPage` → `AuthContext.login()` stores `{ name, role }`
2. `AppRouter` redirects unauthenticated users to `/login`
3. Every route is wrapped in `<ProtectedRoute>` which checks `user.role` against `route.roles[]`
4. Unauthorised access shows an inline "Access Denied" message (no redirect)

### Route Configuration (`routes.js`)
`ROUTES[]` is the single source of truth. It drives three things simultaneously:
- **Sidebar navigation** — `AppShell` filters routes by `user.role`
- **Route guards** — `ProtectedRoute` reads `roles[]` to allow/deny
- **Active highlight** — `AppShell` compares `location.pathname` to each route path

### Replacing Mock Data with Real API
Each page imports from `src/data/mockData.js`. To connect to your Node SDK backend:
1. Create `src/services/api.js` with `fetch()` wrappers for each endpoint
2. Replace the direct `mockData` imports in each page with `useEffect` + `useState` calls
3. No routing or component structure needs to change

---
*Generated for ChainDonate v2.0 — Hyperledger Fabric Blockchain Donation System*
