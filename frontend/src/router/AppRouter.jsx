// src/router/AppRouter.jsx
// Central router — maps every path to its page component.
// All protected routes are wrapped with <ProtectedRoute>.

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AppShell from "../layout/AppShell";

// ── Pages ────────────────────────────────────────────────────────────────────
import LoginPage           from "../pages/login/LoginPage";
import DashboardPage       from "../pages/shared/DashboardPage";

// Gov
import GovRegisterDonorPage   from "../pages/gov/RegisterDonorPage";
import GovRegisterBankPage    from "../pages/gov/RegisterBankPage";
import GovRegisterGovUserPage from "../pages/gov/RegisterGovUserPage";
import GovDonorsPage          from "../pages/gov/DonorsPage";
import GovBanksPage           from "../pages/gov/BanksPage";
import GovNGOsPage            from "../pages/gov/NGOsPage";
import GovDonationsQueryPage  from "../pages/gov/DonationsQueryPage";

// Admin approvals
import ApprovalsPage from "../pages/admin/ApprovalsPage";

// Bank
import BankIssueTokensPage from "../pages/bank/IssueTokensPage";

// Donor
import DonorDonatePage from "../pages/donor/DonatePage";
import DonorFundsPage  from "../pages/donor/FundsPage";

// NGO Admin
import NgoAdminRegisterPage from "../pages/ngo/admin/RegisterPage";
import NgoAdminDetailPage   from "../pages/ngo/admin/DetailPage";

// NGO User
import NgoUserCreateFundPage from "../pages/ngo/user/CreateFundPage";
import NgoUserMyFundsPage    from "../pages/ngo/user/MyFundsPage";
import NgoUserRedeemPage     from "../pages/ngo/user/RedeemPage";
import NGOApprovalsPage from "../pages/ngo/user/NGOApprovalsPage";

// ── Helper: wrap page in shell + protection ───────────────────────────────────
function Protected({ path, children }) {
  return (
    <ProtectedRoute path={path}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-icon">◌</div>
        <div className="empty-text">Loading session...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Auto-redirect root */}
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />

      {/* ── Shared ── */}
      <Route path="/dashboard" element={
        <Protected path="/dashboard"><DashboardPage /></Protected>
      } />

      {/* ── Gov ── */}
      <Route path="/gov/register-donor" element={
        <Protected path="/gov/register-donor"><GovRegisterDonorPage /></Protected>
      } />
      <Route path="/gov/register-bank" element={
        <Protected path="/gov/register-bank"><GovRegisterBankPage /></Protected>
      } />
      <Route path="/gov/register-gov-user" element={
        <Protected path="/gov/register-gov-user"><GovRegisterGovUserPage /></Protected>
      } />
      <Route path="/gov/donors" element={
        <Protected path="/gov/donors"><GovDonorsPage /></Protected>
      } />
      <Route path="/gov/banks" element={
        <Protected path="/gov/banks"><GovBanksPage /></Protected>
      } />
      <Route path="/gov/ngos" element={
        <Protected path="/gov/ngos"><GovNGOsPage /></Protected>
      } />
      <Route path="/gov/donations-query" element={
        <Protected path="/gov/donations-query"><GovDonationsQueryPage /></Protected>
      } />
      <Route path="/gov/approvals" element={
        <Protected path="/gov/approvals"><ApprovalsPage /></Protected>
      } />

      {/* ── Bank ── */}
      <Route path="/bank/issue-tokens" element={
        <Protected path="/bank/issue-tokens"><BankIssueTokensPage /></Protected>
      } />

      {/* ── Donor ── */}
      <Route path="/donor/donate" element={
        <Protected path="/donor/donate"><DonorDonatePage /></Protected>
      } />
      <Route path="/donor/funds" element={
        <Protected path="/donor/funds"><DonorFundsPage /></Protected>
      } />

      {/* ── NGO Admin ── */}
      <Route path="/ngo/register" element={
        <Protected path="/ngo/register"><NgoAdminRegisterPage /></Protected>
      } />
      <Route path="/ngo/detail" element={
        <Protected path="/ngo/detail"><NgoAdminDetailPage /></Protected>
      } />

      {/* ── NGO User ── */}
      <Route path="/ngo/create-fund" element={
        <Protected path="/ngo/create-fund"><NgoUserCreateFundPage /></Protected>
      } />
      <Route path="/ngo/my-funds" element={
        <Protected path="/ngo/my-funds"><NgoUserMyFundsPage /></Protected>
      } />
      <Route path="/ngo/add-expense" element={<Navigate to="/ngo/approvals" replace />} />
      <Route path="/ngo/list-funds" element={<Navigate to="/ngo/my-funds" replace />} />
      <Route path="/ngo/redeem" element={
        <Protected path="/ngo/redeem"><NgoUserRedeemPage /></Protected>
      } />
      <Route path="/ngo/approvals" element={
        <Protected path="/ngo/approvals">{
          (user && user.role === 'ngoAdmin') ? <ApprovalsPage /> : <NGOApprovalsPage />
        }</Protected>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
