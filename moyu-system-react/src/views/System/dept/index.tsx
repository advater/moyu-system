import ResultCard from "@/components/Page/ResultCard";
import { useDeptPage } from "./useDeptPage";
import DeptSearch from "./DeptSearch";
import DeptTable, { DeptToolbar } from "./DeptTable";
import DeptForm from "./DeptForm";

export default function SystemDeptPage() {
  const p = useDeptPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <DeptSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <DeptToolbar
            selectedCount={p.selectedIds.length}
            expanded={p.expanded}
            onCreate={() => p.openForm("create")}
            onToggleExpand={() => p.setExpanded((v) => !v)}
            onDeleteBatch={p.handleDeleteBatch}
          />
        }
        showPagination={false}
      >
        <DeptTable
          loading={p.loading}
          list={p.list}
          userList={p.userList}
          selectedIds={p.selectedIds}
          expanded={p.expanded}
          onSelect={p.setSelectedIds}
          onEdit={(id) => p.openForm("update", id)}
          onCreateChild={(parentId) => p.openForm("create", undefined, parentId)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <DeptForm
        open={p.formOpen}
        type={p.formType}
        id={p.formId}
        parentId={p.parentId}
        onClose={() => p.setFormOpen(false)}
        onSuccess={() => {
          p.setFormOpen(false);
          p.getList();
        }}
      />
    </div>
  );
}
