import { Card, Form } from "antd";
import type { FormInstance } from "antd/es/form";
import type { ReactNode } from "react";

export default function SearchCard({
  form,
  children,
}: {
  form: FormInstance;
  children: ReactNode;
}) {
  return (
    <Card className="page-search" size="small" variant="borderless">
      <Form form={form} layout="inline">
        {children}
      </Form>
    </Card>
  );
}
