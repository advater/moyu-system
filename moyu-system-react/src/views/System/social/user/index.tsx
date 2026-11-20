import ResultCard from "@/components/Page/ResultCard";
import { useSocialUserPage } from "./useSocialUserPage";
import SocialUserSearch from "./SocialUserSearch";
import SocialUserTable from "./SocialUserTable";
import SocialUserDetailModal from "./SocialUserDetailModal";

export default function SystemSocialUserPage() {
  const p = useSocialUserPage();

  return (
    <div>
      <SocialUserSearch form={p.form} onQuery={p.handleQuery} onReset={p.handleReset} />
      <ResultCard
        total={p.pageData.total}
        current={p.pageData.currentPage}
        pageSize={p.pageData.pageSize}
        pageSizes={p.pageData.pageSizes}
        onPageChange={p.handleCurrentChange}
        onSizeChange={p.handleSizeChange}
      >
        <SocialUserTable loading={p.loading} list={p.list} onDetail={p.setDetail} />
      </ResultCard>
      <SocialUserDetailModal detail={p.detail} onClose={() => p.setDetail(null)} />
    </div>
  );
}
