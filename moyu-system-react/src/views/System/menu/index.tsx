import ResultCard from "@/components/Page/ResultCard";
import { useMenuPage } from "./useMenuPage";
import MenuSearch from "./MenuSearch";
import MenuTable, { MenuToolbar } from "./MenuTable";
import MenuForm from "./MenuForm";

export default function SystemMenuPage() {
  const p = useMenuPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <MenuSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        toolbar={
          <MenuToolbar
            expanded={p.expanded}
            onCreate={() => p.openForm("create")}
            onToggleExpand={() => p.setExpanded((v) => !v)}
          />
        }
        showPagination={false}
      >
        <MenuTable
          loading={p.loading}
          list={p.list}
          expanded={p.expanded}
          onEdit={(id, parentId) => p.openForm("update", id, parentId)}
          onCreateChild={(parentId) => p.openForm("create", undefined, parentId)}
          onDelete={p.handleDelete}
          onStatusChange={p.handleStatusChange}
        />
      </ResultCard>
      <MenuForm
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
