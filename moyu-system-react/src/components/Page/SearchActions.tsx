import { Button, Form, Space } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export default function SearchActions({
  onQuery,
  onReset,
}: {
  onQuery: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Form.Item>
      <Space>
        <Button type="primary" icon={<SearchOutlined />} onClick={onQuery}>
          {t("common.query")}
        </Button>
        <Button icon={<ReloadOutlined />} onClick={onReset}>
          {t("common.reset")}
        </Button>
      </Space>
    </Form.Item>
  );
}
