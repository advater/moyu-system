import { Outlet, useLocation } from "react-router-dom";
import { useTagsViewStore } from "@/store/stores/tagsView";
import { normalizePath } from "@/utils/tree";

export default function KeepAliveOutlet() {
  const location = useLocation();
  const { visited } = useTagsViewStore();
  const path = normalizePath(location.pathname);
  const stamp = visited.find((item) => item.path === path)?.stamp ?? 0;
  return <Outlet key={`${path}:${stamp}`} />;
}
