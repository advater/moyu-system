import ResultCard from "@/components/Page/ResultCard";
import { useOAuth2TokenPage } from "./useOAuth2TokenPage";
import OAuth2TokenSearch from "./OAuth2TokenSearch";
import OAuth2TokenTable from "./OAuth2TokenTable";

export default function SystemOAuth2TokenPage() {
  const p = useOAuth2TokenPage();

  return (
    <div>
      {p.modalHolder}
      {p.messageHolder}
      <OAuth2TokenSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <OAuth2TokenTable
          loading={p.loading}
          list={p.list}
          onDelete={p.handleDelete}
          onForceLogout={p.handleForceLogout}
        />
      </ResultCard>
    </div>
  );
}
