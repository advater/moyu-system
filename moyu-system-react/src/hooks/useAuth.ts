import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ssoLogout, bootstrapSession } from "@/utils/auth";
import { useUserStore } from "@/store/stores/user";
import { usePermissionStore } from "@/store/stores/permission";

export function useAuth() {
  const navigate = useNavigate();
  const { getUserInfo, getRoles, getIsSetUser } = useUserStore();
  const { getHasLoaded } = usePermissionStore();

  const bootstrap = useCallback(() => bootstrapSession(), []);

  const logout = useCallback((path = "/login") => {
    return ssoLogout(path);
  }, []);

  return {
    user: getUserInfo,
    roles: getRoles,
    isSetUser: getIsSetUser,
    hasLoaded: getHasLoaded,
    bootstrap,
    logout,
    goLogin: () => navigate("/login"),
  };
}
