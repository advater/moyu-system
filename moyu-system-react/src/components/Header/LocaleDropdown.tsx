import { GlobalOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";
import { useAppStore } from "@/store/stores/app";
import { useLocaleStore, type LocaleCode } from "@/store/stores/locale";

const LANGS: { key: LocaleCode; label: string }[] = [
  { key: "zh-CN", label: "简体中文" },
  { key: "en", label: "English" },
];

export default function LocaleDropdown() {
  const { locale } = useAppStore();
  const { lang, setLang } = useLocaleStore();
  if (!locale) return null;

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        selectedKeys: [lang],
        items: LANGS.map((item) => ({ key: item.key, label: item.label })),
        onClick: ({ key }) => setLang(key as LocaleCode),
      }}
    >
      <button type="button" className="header-icon-btn">
        <GlobalOutlined />
      </button>
    </Dropdown>
  );
}
