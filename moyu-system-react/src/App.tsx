import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

import store from "./store";
import ThemeProvider from "./components/ThemeProvider";
import { bindAppNavigate } from "./router/navigation";
import { createAppRouter, isAuthPath } from "./router";
import Token from "./utils/token";
import { trySilentRefresh } from "./utils/request";
import { bootstrapSession, resetSession } from "./utils/auth";

function AppRouter() {
  const { t } = useTranslation();
  const [router] = useState(() => {
    const next = createAppRouter();
    bindAppNavigate((to, opts) => {
      void next.navigate(to, { replace: opts?.replace ?? true });
    });
    return next;
  });
  const [pathname, setPathname] = useState(() => router.state.location.pathname);
  const [booting, setBooting] = useState(true);
  const forceLight = isAuthPath(pathname) || !Token.getToken();

  useEffect(() => {
    return router.subscribe((state) => {
      setPathname(state.location.pathname);
    });
  }, [router]);

  useEffect(() => {
    const boot = async () => {
      // 登录/注册/找回密码页不刷 token、不拉会话，避免匿名页打 refresh-token
      if (isAuthPath(router.state.location.pathname)) return;
      // 本地无 accessToken（新标签页/重开标签页）时，先用 httpOnly 刷新 Cookie 静默恢复会话；
      // 恢复失败（匿名访问）不提示、不登出，照常进登录页
      if (!Token.getToken() && !(await trySilentRefresh())) return;
      await bootstrapSession().catch(() => {
        resetSession();
      });
    };
    void boot().finally(() => setBooting(false));
  }, []);

  return (
    <ThemeProvider forceLight={forceLight}>
      {booting ? (
        <div style={{ padding: 120, textAlign: "center" }}>
          <Spin size="large">
            <div style={{ padding: 48, color: "#999" }}>{t("common.loading")}</div>
          </Spin>
        </div>
      ) : (
        <RouterProvider router={router} />
      )}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}
