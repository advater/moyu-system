import { Button, Card } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export default function AreaSearch({ onQueryIp }: { onQueryIp: () => void }) {
  return (
    <Card className="page-search" size="small" variant="borderless">
      <Button type="primary" icon={<SearchOutlined />} onClick={onQueryIp}>
        IP 查询
      </Button>
    </Card>
  );
}
