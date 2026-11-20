import { Tag } from "antd";
import { getDictColor, getDictLabel } from "@/utils/dict";

export default function DictTag({
  type,
  value,
}: {
  type: string;
  value: any;
}) {
  const label = getDictLabel(type, value);
  const color = getDictColor(type, value);
  if (value === undefined || value === null || value === "") return <span>-</span>;
  return <Tag color={color}>{label}</Tag>;
}
