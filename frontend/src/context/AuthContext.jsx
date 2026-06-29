// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const normalizeUser = (payload) => {
  if (!payload) return null;

  const donorId = String(payload.donorId || payload.donor_id || "").trim();
  const donorCertificate = String(payload.donorCertificate || payload.donor_certificate || "").trim();
  const kycStatus = String(payload.kycStatus || payload.kyc_status || "NOT_SUBMITTED").trim().toUpperCase() || "NOT_SUBMITTED";
  const email = String(payload.email || "").trim();
  const name = String(payload.name || "Donor").trim() || "Donor";

  return {
    id: payload.id,
    donorId,
    donorCertificate,
    kycStatus,
    kycRecordId: String(payload.kycRecordId || payload.kyc_record_id || "").trim(),
    kycSubmittedAt: String(payload.kycSubmittedAt || payload.kyc_submitted_at || "").trim(),
    kycReviewedAt: String(payload.kycReviewedAt || payload.kyc_reviewed_at || "").trim(),
    role: payload.role || "donor",
    name,
    email,
    // userCert prioritizes database-generated certificate, then donorId, then email
    userCert: donorCertificate || donorId || email,
  };
};

const roleDefaults = {
  donor: "donor001",
  govAdmin: "govUserTom",
  govUser: "govUserTom",
  bankUser: "bank001",
  ngoAdmin: "ngoAdminUser",
  ngoUser: "ngoUserSeed",
};

const normalizeRoleUserCert = (role, userCert) => {
  const safeRole = String(role || "").trim();
  const current = String(userCert || "").trim();
  const fallback = roleDefaults[safeRole] || current;

  return current || fallback;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      try {
        const data = await authApi.me();
        if (!active) return;
        setUser(normalizeUser(data?.user));
      } catch (error) {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const normalized = normalizeUser(data?.user);
    setUser(normalized);
    return normalized;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    const normalized = normalizeUser(data?.user);
    setUser(normalized);
    return normalized;
  };

  const loginWithRole = ({ role, name, userCert, email }) => {
    const safeRole = String(role || "").trim();
    const safeName = String(name || "User").trim() || "User";
    const safeUserCert = normalizeRoleUserCert(safeRole, userCert);

    setUser({
      id: `role-${safeRole || "user"}`,
      donorId: safeRole === "donor" ? safeUserCert : "",
      kycStatus: safeRole === "donor" ? "NOT_SUBMITTED" : "",
      kycRecordId: "",
      kycSubmittedAt: "",
      kycReviewedAt: "",
      role: safeRole,
      name: safeName,
      email: String(email || "").trim(),
      userCert: safeUserCert,
    });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if request fails, clear local state to avoid stale sessions in UI.
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, loginWithRole, logout }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
