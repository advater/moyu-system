import { Col, Row } from "antd";
import ResultCard from "@/components/Page/ResultCard";
import { useUserPage } from "./useUserPage";
import UserDeptTree from "./UserDeptTree";
import UserSearch from "./UserSearch";
import UserToolbar from "./UserToolbar";
import UserTable from "./UserTable";
import UserForm from "./UserForm";
import AssignRoleForm from "./AssignRoleForm";
import ImportForm from "./ImportForm";

export default function SystemUserPage() {
  const p = useUserPage();

  return (
    <div className="system-user-page">
      {p.modalHolder}
      {p.messageHolder}
      <Row gutter={16}>
        <Col span={5} xs={24} lg={5}>
          <UserDeptTree
            treeData={p.deptTree}
            onSelect={(id) => {
              p.setDeptId(id);
              p.resetPageData();
            }}
          />
        </Col>
        <Col span={19} xs={24} lg={19}>
          <UserSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
          <ResultCard
            toolbar={
              <UserToolbar
                selectedCount={p.selectedIds.length}
                exportLoading={p.exportLoading}
                onCreate={() => p.openForm("create")}
                onImport={() => p.setImportOpen(true)}
                onExport={p.handleExport}
                onDeleteBatch={p.handleDeleteBatch}
              />
            }
            total={p.pageData.total}
            current={p.pageData.currentPage}
            pageSize={p.pageData.pageSize}
            pageSizes={p.pageData.pageSizes}
            onPageChange={p.handleCurrentChange}
            onSizeChange={p.handleSizeChange}
          >
            <UserTable
              loading={p.loading}
              list={p.list}
              selectedIds={p.selectedIds}
              onSelect={p.setSelectedIds}
              onEdit={(id) => p.openForm("update", id)}
              onDelete={p.handleDelete}
              onResetPwd={p.handleResetPwd}
              onAssignRole={(row) => {
                p.setRoleUser(row);
                p.setRoleOpen(true);
              }}
              onStatusChange={p.handleStatusChange}
            />
          </ResultCard>
        </Col>
      </Row>
      <UserForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
      <AssignRoleForm
        open={p.roleOpen}
        user={p.roleUser}
        onClose={() => p.setRoleOpen(false)}
        onSuccess={() => {
          p.setRoleOpen(false);
          p.getList();
        }}
      />
      <ImportForm
        open={p.importOpen}
        onClose={() => p.setImportOpen(false)}
        onSuccess={() => {
          p.setImportOpen(false);
          p.getList();
        }}
      />
    </div>
  );
}
