import { resolveRouterBasename } from "@/config/env";

type AppNavigate = (to: string, opts?: { replace?: boolean }) => void;

let navigateImpl: AppNavigate | null = null;

export function bindAppNavigate(fn: AppNavigate | null) {
  navigateImpl = fn;
}

export function navigateApp(to: string, opts?: { replace?: boolean }) {
  if (navigateImpl) {
    navigateImpl(to, opts);
    return;
  }
  const basename = resolveRouterBasename() || "";
  const next = to.startsWith("/") ? to : `/${to}`;
  window.history.replaceState(null, "", `${basename}${next}`);
}
