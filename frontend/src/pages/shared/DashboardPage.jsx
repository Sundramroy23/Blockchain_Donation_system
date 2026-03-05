// src/pages/shared/DashboardPage.jsx
import { useEffect, useState } from "react";
import { Link }       from "react-router-dom";
import { useAuth }    from "../../context/AuthContext";
import { useToast }   from "../../context/ToastContext";
import PageHeader     from "../../components/shared/PageHeader";
import DataTable      from "../../components/shared/DataTable";
import { donorApi, bankApi, ngoApi, fundApi, tokenApi } from "../../services/api";

const LEDGER_QUERY_CERT = "govUserTom";
const fmt   = (n) => n?.toLocaleString() ?? "–";
const short = (s) => s?.length > 12 ? s.slice(0, 12) + "…" : s;
const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const getTokenRemaining = (token) => {
  const directRemaining = toSafeNumber(token?.remainingAmount);
  if (directRemaining > 0) return directRemaining;
  const minted = toSafeNumber(token?.amount);
  const spent = toSafeNumber(token?.spentAmount);
  const fallbackRemaining = minted - spent;
  return fallbackRemaining > 0 ? fallbackRemaining : 0;
};

const normalizeRole = (rawRole) => {
  const role = String(rawRole || "").trim().toLowerCase();
  if (role === "govadmin" || role === "gov_admin") return "govAdmin";
  if (role === "bankuser" || role === "bank_user") return "bankUser";
  if (role === "ngouser" || role === "ngo_user") return "ngoUser";
  if (role === "ngoadmin" || role === "ngo_admin") return "ngoAdmin";
  if (role === "govuser" || role === "gov_user") return "govUser";
  if (role === "donor") return "donor";
  if (role === "admin") return "admin";
  return rawRole;
};

const getRaisedAmount = (fund) => {
  const fromTotalTokens = toSafeNumber(fund?.totalTokens);
  if (fromTotalTokens > 0) return fromTotalTokens;

  const fromCurrentAmount = toSafeNumber(fund?.currentAmount);
  if (fromCurrentAmount > 0) return fromCurrentAmount;

  const fromRaised = toSafeNumber(fund?.raised);
  if (fromRaised > 0) return fromRaised;

  if (Array.isArray(fund?.donations)) {
    return fund.donations.reduce((sum, item) => sum + toSafeNumber(item?.amount), 0);
  }
  return 0;
};

const buildDonationRows = (records) => {
  const rows = [];
  for (const record of records || []) {
    const groupedItems = Array.isArray(record?.donations) ? record.donations : null;
    if (groupedItems) {
      for (let index = 0; index < groupedItems.length; index += 1) {
        const item = groupedItems[index] || {};
        rows.push({
          id: `${record.fundId || 'fund'}-${index + 1}`,
          donor: item.donorId || "—",
          fund: record.fundId || item.fundId || "—",
          amount: toSafeNumber(item.amount),
          date: item.timestamp || record.timestamp || "—",
          tx: item.tokenId || record.tokenId || "—",
        });
      }
      continue;
    }

    if (record && (record.amount != null || record.tokenId || record.fundId)) {
      rows.push({
        id: record.id || record.tokenId || `${record.fundId || 'fund'}-1`,
        donor: record.donorId || "—",
        fund: record.fundId || "—",
        amount: toSafeNumber(record.amount),
        date: record.timestamp || record.date || "—",
        tx: record.tokenId || record.tx || "—",
      });
    }
  }
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

// Static config for roles that don't need live stats
const STATIC_CONFIG = {
  admin:   { title: "Platform Overview", stats: [{ l:"Organizations", v:"0", gold:true }, { l:"Active Funds", v:"0" }, { l:"Total Txns", v:"0" }] },
  govUser: { title: "Government Portal", stats: [{ l:"Total Donors", v:"—" }, { l:"Banks", v:"—" }, { l:"NGOs", v:"—" }] },
};

// Gov Admin dashboard with live counts fetched from backend
function GovAdminDashboard() {
  const { user } = useAuth();
  const userCert = LEDGER_QUERY_CERT || user?.userCert;
  const [counts, setCounts] = useState({ donors: "…", banks: "…", ngos: "…" });
  const [donationRows, setDonationRows] = useState([]);

  useEffect(() => {
    if (!userCert) {
      setCounts({ donors: "—", banks: "—", ngos: "—" });
      setDonationRows([]);
      return;
    }

    Promise.allSettled([
      donorApi.getAll({ userCert }),
      bankApi.getAll({ userCert }),
      ngoApi.getAll({ userCert }),
      fundApi.getAll({ userCert }),
    ]).then(([d, b, n, f]) => {
      const funds = f.status === "fulfilled" ? (f.value.data || []) : [];
      setCounts({
        donors: d.status === "fulfilled" ? (d.value.data?.length ?? "—") : "—",
        banks:  b.status === "fulfilled" ? (b.value.data?.length ?? "—") : "—",
        ngos:   n.status === "fulfilled" ? (n.value.data?.length ?? "—") : "—",
      });
      setDonationRows(buildDonationRows(funds).slice(0, 10));
    });
  }, [userCert]);

  const stats = [
    { l: "Registered Donors", v: String(counts.donors), gold: true },
    { l: "Registered Banks",  v: String(counts.banks) },
    { l: "Registered NGOs",   v: String(counts.ngos) },
    { l: "Ledger Donations",  v: String(donationRows.length) },
  ];

  return (
    <>
      <PageHeader
        title="Government Dashboard"
        desc={new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      />

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.gold ? "gold" : ""}`}>
            <div className="stat-label">{s.l}</div>
            <div className={`stat-value ${s.gold ? "gold" : ""}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Quick-action cards */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
          <div className="card-title" style={{ marginBottom: 6 }}>Register Users</div>
          <div className="card-sub">As Gov Admin you can register Donors, Banks, and Gov Portal Users onto the blockchain network.</div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Register Donor",    path: "/gov/register-donor" },
              { label: "Register Bank",     path: "/gov/register-bank" },
              { label: "Register Gov User", path: "/gov/register-gov-user" },
            ].map(({ label, path }) => (
              <Link key={path} to={path}
                style={{ padding: "6px 14px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-1)", textDecoration: "none", fontFamily: "'DM Mono',monospace" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "3px solid var(--blue)" }}>
          <div className="card-title" style={{ marginBottom: 6 }}>View Registry</div>
          <div className="card-sub">Browse all registered entities on the ledger — Donors, Banks, and NGOs.</div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "All Donors", path: "/gov/donors" },
              { label: "All Banks",  path: "/gov/banks" },
              { label: "All NGOs",   path: "/gov/ngos" },
            ].map(({ label, path }) => (
              <Link key={path} to={path}
                style={{ padding: "6px 14px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-1)", textDecoration: "none", fontFamily: "'DM Mono',monospace" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <div className="card-title">Recent Donations</div>
          <span className="text-dim">Ledger events</span>
        </div>
        <DataTable
          columns={[
            { key:"id",     label:"TX ID",  mono:true },
            { key:"donor",  label:"Donor"  },
            { key:"fund",   label:"Fund"   },
            { key:"amount", label:"Amount", render: (r) => <><span className="text-gold">◈</span> {fmt(r.amount)}</> },
            { key:"date",   label:"Date",   mono:true },
            { key:"tx",     label:"Hash",   mono:true, render: (r) => short(r.tx) },
          ]}
          data={donationRows}
        />
      </div>
    </>
  );
}

function DonorDashboard() {
  const toast = useToast();
  const { user } = useAuth();
  const [donorId, setDonorId] = useState(user?.userCert || "");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ remaining: 0, donated: 0, fundsSupported: 0 });
  const [rows, setRows] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpForm, setTopUpForm] = useState({ bankCert: "", bankId: "", amount: "" });

  const loadBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await bankApi.getAll({ userCert: LEDGER_QUERY_CERT });
      const bankList = (Array.isArray(res?.data) ? res.data : []).map((item) => {
        const bankId = String(item?.bankId || item?.userCert || "").trim();
        return {
          bankId,
          bankCert: bankId,
          name: item?.name || bankId || "Unknown Bank",
        };
      }).filter((item) => item?.bankId);

      setBanks(bankList);
      if (bankList.length > 0) {
        setTopUpForm((prev) => {
          const exists = bankList.some((bank) => bank?.bankId === prev.bankId);
          if (exists) return prev;
          return { ...prev, bankId: bankList[0]?.bankId || "", bankCert: bankList[0]?.bankCert || "" };
        });
      }
    } catch (error) {
      setBanks([]);
      toast(error?.response?.data?.error || error.message || "Failed to load bank registry", "error");
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadDonorDashboard = async () => {
    if (!donorId) {
      toast("donorId is required", "error");
      return;
    }

    setLoading(true);
    try {
      const queryCert = LEDGER_QUERY_CERT;
      const [tokensRes, donationsRes] = await Promise.allSettled([
        tokenApi.getByOwner({ userCert: queryCert, ownerId: donorId }),
        fundApi.getByDonor(donorId, { userCert: queryCert }),
      ]);

      const tokens = tokensRes.status === "fulfilled" ? (tokensRes.value.data || []) : [];
      const donationGroups = donationsRes.status === "fulfilled" ? (donationsRes.value.data || []) : [];
      const donationRows = buildDonationRows(donationGroups).slice(0, 20);

      const remaining = tokens.reduce((sum, item) => sum + getTokenRemaining(item), 0);
      const donated = donationRows.reduce((sum, item) => sum + toSafeNumber(item?.amount), 0);
      const fundsSupported = new Set(donationRows.map((item) => item?.fund).filter(Boolean)).size;

      setStats({ remaining, donated, fundsSupported });
      setRows(donationRows);

      if (donationRows.length === 0) {
        toast("No donations found for this donorId", "info");
      }
    } catch (error) {
      toast(error?.response?.data?.error || error.message || "Failed to load donor dashboard", "error");
      setStats({ remaining: 0, donated: 0, fundsSupported: 0 });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
    if (donorId) {
      loadDonorDashboard();
    }
  }, []);

  const handleTopUp = async () => {
    if (!donorId) {
      toast("Donor ID is required", "error");
      return;
    }
    const resolvedBankId = topUpForm.bankId;
    const resolvedBankCert = topUpForm.bankCert || topUpForm.bankId;

    if (!resolvedBankCert || !resolvedBankId || !topUpForm.amount) {
      toast("Bank selection and amount are required", "error");
      return;
    }

    setTopUpLoading(true);
    try {
      await tokenApi.issue({
        userCert: resolvedBankCert,
        bankId: resolvedBankId,
        ownerId: donorId,
        amount: topUpForm.amount,
      });
      toast("Top-up successful. Donor tokens credited.", "success");
      setTopUpForm((prev) => ({ ...prev, amount: "" }));
      loadDonorDashboard();
    } catch (error) {
      toast(error?.response?.data?.error || error.message || "Top-up failed", "error");
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Donor Dashboard"
        desc={new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div className="form-group" style={{ flex:1, minWidth:220 }}>
            <label>Donor ID</label>
            <input value={donorId} onChange={(e) => setDonorId(e.target.value)} placeholder="e.g. donor001" />
          </div>
          <button className="btn btn-primary" onClick={loadDonorDashboard} disabled={loading || !donorId}>
            {loading ? "Loading…" : "Load Dashboard"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Top Up Tokens</div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label>Select Bank</label>
            <select
              value={topUpForm.bankId}
              onChange={(e) => {
                const selectedBank = (Array.isArray(banks) ? banks : []).find((bank) => bank?.bankId === e.target.value);
                setTopUpForm((prev) => ({
                  ...prev,
                  bankId: selectedBank?.bankId || "",
                  bankCert: selectedBank?.bankCert || "",
                }));
              }}
            >
              <option value="">Select bank...</option>
              {(Array.isArray(banks) ? banks : []).map((bank) => (
                <option key={bank?.bankId} value={bank?.bankId}>{bank?.name}</option>
              ))}
            </select>
            <span className="input-hint">Selecting a bank auto-fills both Bank User Cert and Bank ID.</span>
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              value={topUpForm.amount}
              onChange={(e) => setTopUpForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="e.g. 500"
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={loadBanks} disabled={loadingBanks}>
            {loadingBanks ? "Refreshing Banks..." : "Refresh Banks"}
          </button>
          <button className="btn btn-primary" onClick={handleTopUp} disabled={topUpLoading || !donorId}>
            {topUpLoading ? "Topping up..." : "Top Up Tokens ◈"}
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card gold">
          <div className="stat-label">My Tokens</div>
          <div className="stat-value gold">{fmt(stats.remaining)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Donated</div>
          <div className="stat-value">{fmt(stats.donated)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Funds Supported</div>
          <div className="stat-value">{stats.fundsSupported}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <div className="card-title">Recent Activity</div>
          <span className="text-dim">Ledger events</span>
        </div>
        <DataTable
          columns={[
            { key:"id",     label:"TX ID",  mono:true },
            { key:"donor",  label:"Donor"  },
            { key:"fund",   label:"Fund"   },
            { key:"amount", label:"Amount", render: (r) => <><span className="text-gold">◈</span> {fmt(r.amount)}</> },
            { key:"date",   label:"Date",   mono:true },
            { key:"tx",     label:"Hash",   mono:true, render: (r) => short(r.tx) },
          ]}
          data={rows}
          emptyText="No donations found for this donor"
        />
      </div>
    </>
  );
}

// Generic dashboard for all other roles
function GenericDashboard({ cfg, activityRows }) {
  const cols = cfg.stats.length <= 3 ? `repeat(${cfg.stats.length},1fr)` : "repeat(4,1fr)";
  return (
    <>
      <PageHeader
        title={cfg.title}
        desc={new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      />
      <div className="stats-row" style={{ gridTemplateColumns: cols }}>
        {cfg.stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.gold ? "gold" : ""}`}>
            <div className="stat-label">{s.l}</div>
            <div className={`stat-value ${s.gold ? "gold" : ""}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <div className="card-title">Recent Activity</div>
          <span className="text-dim">Ledger events</span>
        </div>
        <DataTable
          columns={[
            { key:"id",     label:"TX ID",  mono:true },
            { key:"donor",  label:"Donor"  },
            { key:"fund",   label:"Fund"   },
            { key:"amount", label:"Amount", render: (r) => <><span className="text-gold">◈</span> {fmt(r.amount)}</> },
            { key:"date",   label:"Date",   mono:true },
            { key:"tx",     label:"Hash",   mono:true, render: (r) => short(r.tx) },
          ]}
          data={activityRows}
        />
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dynamic, setDynamic] = useState({ stats: null, activityRows: [] });
  const role = normalizeRole(user?.role);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const userCert = LEDGER_QUERY_CERT || user?.userCert;
      if (!role || !userCert) {
        if (!cancelled) setDynamic({ stats: null, activityRows: [] });
        return;
      }

      try {
        if (role === "donor") {
          if (!cancelled) {
            setDynamic({ stats: null, activityRows: [] });
          }
          return;
        }

        if (role === "bankUser") {
          const tokensRes = await tokenApi.getByBank({ userCert, bankId: userCert });
          const tokens = tokensRes?.data?.data || [];
          const issued = tokens.reduce((sum, item) => sum + Number(item?.totalAmount ?? item?.amount ?? 0), 0);
          const circulating = tokens.reduce((sum, item) => sum + Number(item?.remainingAmount ?? 0), 0);

          if (!cancelled) {
            setDynamic({
              stats: [
                { l: "Tokens Issued", v: fmt(issued), gold: true },
                { l: "Circulating", v: fmt(circulating) },
                { l: "Transactions", v: String(tokens.length) },
              ],
              activityRows: tokens.slice(0, 10).map((item) => ({
                id: item?.tokenId || "—",
                donor: item?.ownerId || "—",
                fund: item?.toId || "—",
                amount: Number(item?.remainingAmount ?? item?.amount ?? 0),
                date: item?.issuedAt || item?.transferredAt || "—",
                tx: item?.tokenId || "—",
              })),
            });
          }
          return;
        }

        if (role === "ngoUser") {
          const [byNgoRes, allFundsRes] = await Promise.allSettled([
            fundApi.getByNGO(userCert, { userCert }),
            fundApi.getAll({ userCert }),
          ]);

          const byNgoFunds = byNgoRes.status === "fulfilled" ? (byNgoRes.value.data || []) : [];
          const allFunds = allFundsRes.status === "fulfilled" ? (allFundsRes.value.data || []) : [];
          const ownFundsFromAll = allFunds.filter((item) => String(item?.ngoId || "") === String(userCert || ""));
          const funds = byNgoFunds.length > 0 ? byNgoFunds : (ownFundsFromAll.length > 0 ? ownFundsFromAll : allFunds);

          const openFunds = funds.filter((item) => String(item?.status || "").toUpperCase() === "ACTIVE").length;
          const totalRaised = funds.reduce((sum, item) => sum + getRaisedAmount(item), 0);
          const totalExpenses = funds.reduce((sum, item) => sum + (Array.isArray(item?.expenses) ? item.expenses.length : 0), 0);
          const totalRedeemed = funds.reduce((sum, item) => {
            const expenses = Array.isArray(item?.expenses) ? item.expenses : [];
            return sum + expenses.reduce((inner, expense) => inner + Number(expense?.amount || 0), 0);
          }, 0);

          if (!cancelled) {
            setDynamic({
              stats: [
                { l: "Open Funds", v: String(openFunds), gold: true },
                { l: "Total Raised", v: fmt(totalRaised) },
                { l: "Expenses Filed", v: String(totalExpenses) },
                { l: "Redeemed", v: fmt(totalRedeemed) },
              ],
              activityRows: buildDonationRows(funds).slice(0, 10),
            });
          }
          return;
        }

        if (role === "ngoAdmin") {
          const [ngosRes, fundsRes] = await Promise.allSettled([
            ngoApi.getAll({ userCert }),
            fundApi.getAll({ userCert }),
          ]);
          const ngos = ngosRes.status === "fulfilled" ? (ngosRes.value.data || []) : [];
          const funds = fundsRes.status === "fulfilled" ? (fundsRes.value.data || []) : [];
          const activeFunds = funds.filter((item) => String(item?.status || "").toUpperCase() === "ACTIVE").length;
          const totalRaised = funds.reduce((sum, item) => sum + getRaisedAmount(item), 0);
          const uniqueNgoCountFromFunds = new Set(
            funds.map((item) => String(item?.ngoId || "").trim()).filter(Boolean)
          ).size;
          const registeredNgoCount = ngos.length > 0 ? ngos.length : uniqueNgoCountFromFunds;

          if (!cancelled) {
            setDynamic({
              stats: [
                { l: "Registered NGOs", v: String(registeredNgoCount), gold: true },
                { l: "Active Funds", v: String(activeFunds) },
                { l: "Total Raised", v: fmt(totalRaised) },
              ],
              activityRows: buildDonationRows(funds).slice(0, 10),
            });
          }
          return;
        }

        if (role === "admin" || role === "govUser") {
          const [fundsRes, donorsRes, banksRes, ngosRes] = await Promise.allSettled([
            fundApi.getAll({ userCert }),
            donorApi.getAll({ userCert }),
            bankApi.getAll({ userCert }),
            ngoApi.getAll({ userCert }),
          ]);

          const funds = fundsRes.status === "fulfilled" ? (fundsRes.value.data || []) : [];
          const donationRows = buildDonationRows(funds).slice(0, 10);
          const activeFunds = funds.filter((item) => String(item?.status || "").toUpperCase() === "ACTIVE").length;

          const donorsCount = donorsRes.status === "fulfilled" ? (donorsRes.value.data || []).length : null;
          const banksCount = banksRes.status === "fulfilled" ? (banksRes.value.data || []).length : null;
          const ngosCount = ngosRes.status === "fulfilled" ? (ngosRes.value.data || []).length : null;

          const organizations = [donorsCount, banksCount, ngosCount].some((value) => value != null)
            ? (toSafeNumber(donorsCount) + toSafeNumber(banksCount) + toSafeNumber(ngosCount))
            : null;

          const txCount = fundsRes.status === "fulfilled" ? donationRows.length : null;
          const activeFundsValue = fundsRes.status === "fulfilled" ? activeFunds : null;

          if (!cancelled) {
            setDynamic({
              stats: role === "admin"
                ? [
                    { l: "Organizations", v: organizations == null ? "—" : String(organizations), gold: true },
                    { l: "Active Funds", v: activeFundsValue == null ? "—" : String(activeFundsValue) },
                    { l: "Total Txns", v: txCount == null ? "—" : String(txCount) },
                  ]
                : [
                    { l: "Total Donors", v: donorsCount == null ? "—" : String(donorsCount), gold: true },
                    { l: "Banks", v: banksCount == null ? "—" : String(banksCount) },
                    { l: "NGOs", v: ngosCount == null ? "—" : String(ngosCount) },
                  ],
              activityRows: donationRows,
            });
          }
          return;
        }

        const fallbackFundsRes = await fundApi.getAll({ userCert });
        const fallbackFunds = fallbackFundsRes?.data || [];
        const fallbackDonationRows = buildDonationRows(fallbackFunds).slice(0, 10);
        const fallbackActiveFunds = fallbackFunds.filter((item) => String(item?.status || "").toUpperCase() === "ACTIVE").length;

        if (!cancelled) {
          setDynamic({
            stats: [
              { l: "Organizations", v: "—", gold: true },
              { l: "Active Funds", v: String(fallbackActiveFunds) },
              { l: "Total Txns", v: String(fallbackDonationRows.length) },
            ],
            activityRows: fallbackDonationRows,
          });
        }
        return;

      } catch (error) {
        if (!cancelled) setDynamic({ stats: null, activityRows: [] });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [role, user?.userCert]);

  if (role === "govAdmin") return <GovAdminDashboard />;
  if (role === "donor") return <DonorDashboard />;

  const cfg = {
    ...(STATIC_CONFIG[role] || STATIC_CONFIG.admin),
    stats: dynamic.stats || (STATIC_CONFIG[role] || STATIC_CONFIG.admin).stats,
  };

  return <GenericDashboard cfg={cfg} activityRows={dynamic.activityRows} />;
}
