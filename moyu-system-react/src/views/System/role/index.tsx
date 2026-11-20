import ResultCard from "@/components/Page/ResultCard";
import { useRolePage } from "./useRolePage";
import RoleSearch from "./RoleSearch";
import RoleTable, { RoleToolbar } from "./RoleTable";
import RoleForm from "./RoleForm";
import AssignMenuForm from "./AssignMenuForm";
import DataPermissionForm from "./DataPermissionForm";
import RoleCopyForm from "./RoleCopyForm";

export default function SystemRolePage() {
  const p = useRolePage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <RoleSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <RoleToolbar
            selectedCount={p.selectedIds.length}
            onCreate={() => p.openForm("create")}
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
        <RoleTable
          loading={p.loading}
          list={p.list}
          selectedIds={p.selectedIds}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onAssignMenu={(row) => {
            p.setCurrentRole(row);
            p.setMenuOpen(true);
          }}
          onAssignData={(row) => {
            p.setCurrentRole(row);
            p.setDataOpen(true);
          }}
          onCopy={(row) => {
            p.setCurrentRole(row);
            p.setCopyOpen(true);
          }}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <RoleForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
      <AssignMenuForm
        open={p.menuOpen}
        role={p.currentRole}
        onClose={() => p.setMenuOpen(false)}
        onSuccess={() => {
          p.setMenuOpen(false);
          p.getList();
        }}
      />
      <DataPermissionForm
        open={p.dataOpen}
        role={p.currentRole}
        onClose={() => p.setDataOpen(false)}
        onSuccess={() => {
          p.setDataOpen(false);
          p.getList();
        }}
      />
      <RoleCopyForm
        open={p.copyOpen}
        role={p.currentRole}
        onClose={() => p.setCopyOpen(false)}
        onSuccess={() => {
          p.setCopyOpen(false);
          p.getList();
        }}
      />
    </div>
  );
}
