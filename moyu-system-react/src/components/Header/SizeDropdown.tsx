import { FontSizeOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";
import { useTranslation } from "react-i18next";
import { useAppStore, type ComponentSize } from "@/store/stores/app";

const SIZE_LABEL: Record<ComponentSize, string> = {
  small: "size.small",
  middle: "size.default",
  large: "size.large",
};

export default function SizeDropdown() {
  const { t } = useTranslation();
  const { size, currentSize, setCurrentSize } = useAppStore();
  if (!size) return null;

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        selectedKeys: [currentSize],
        items: (["small", "middle", "large"] as ComponentSize[]).map((value) => ({
          key: value,
          label: t(SIZE_LABEL[value]),
        })),
        onClick: ({ key }) => setCurrentSize(key as ComponentSize),
      }}
    >
      <button type="button" className="header-icon-btn">
        <FontSizeOutlined />
      </button>
    </Dropdown>
  );
}
