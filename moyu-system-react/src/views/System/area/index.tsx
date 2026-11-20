import ResultCard from "@/components/Page/ResultCard";
import { useAreaPage } from "./useAreaPage";
import AreaSearch from "./AreaSearch";
import AreaTable from "./AreaTable";
import AreaIpModal from "./AreaIpModal";

export default function SystemAreaPage() {
  const p = useAreaPage();

  return (
    <div>
      <AreaSearch onQueryIp={p.openIp} />
      <ResultCard showPagination={false}>
        <AreaTable loading={p.loading} list={p.treeData} />
      </ResultCard>
      <AreaIpModal
        open={p.ipOpen}
        loading={p.ipLoading}
        result={p.ipResult}
        form={p.form}
        onOk={p.queryIp}
        onCancel={p.closeIp}
      />
    </div>
  );
}
