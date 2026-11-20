import { useCallback, useEffect, useState } from "react";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useAppStore } from "@/store/stores/app";

export default function Screenfull() {
  const { screenfull } = useAppStore();
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void document.documentElement.requestFullscreen();
  }, []);

  if (!screenfull) return null;

  const Icon = full ? FullscreenExitOutlined : FullscreenOutlined;
  return (
    <button type="button" className="header-icon-btn" onClick={toggle}>
      <Icon />
    </button>
  );
}
