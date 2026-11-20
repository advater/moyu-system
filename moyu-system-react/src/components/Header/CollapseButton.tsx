import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useAppStore } from "@/store/stores/app";

export default function CollapseButton() {
  const { collapse, hamburger, setCollapse } = useAppStore();
  if (!hamburger) return null;

  const Icon = collapse ? MenuUnfoldOutlined : MenuFoldOutlined;
  return (
    <button type="button" className="header-icon-btn" onClick={() => setCollapse(!collapse)}>
      <Icon />
    </button>
  );
}
