import { Card } from "antd";
import type { ReactNode } from "react";
import Pagination from "@/components/Pagination";

export default function ResultCard({
  toolbar,
  children,
  total = 0,
  current = 1,
  pageSize = 10,
  pageSizes,
  onPageChange,
  onSizeChange,
  showPagination = true,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  total?: number;
  current?: number;
  pageSize?: number;
  pageSizes?: number[];
  onPageChange?: (page: number) => void;
  onSizeChange?: (size: number) => void;
  showPagination?: boolean;
}) {
  return (
    <Card className="page-result" variant="borderless">
      {toolbar ? <div className="toolbar-wrapper">{toolbar}</div> : null}
      {children}
      {showPagination ? (
        <Pagination
          total={total}
          current={current}
          pageSize={pageSize}
          pageSizes={pageSizes}
          onShowSizeChange={(_, size) => onSizeChange?.(size)}
          onChange={(c) => onPageChange?.(c)}
        />
      ) : null}
    </Card>
  );
}
