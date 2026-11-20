import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCrudList } from "@/hooks/useCrudList";
import * as JobLogApi from "@/api/system/jobLog";
import type { JobLogVO } from "@/api/system/jobLog";

export function useJobLogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("id");
  const crud = useCrudList<JobLogVO>((params) =>
    JobLogApi.getJobLogPage({
      page: params.page,
      pageSize: params.pageSize,
      handlerName: params.handlerName,
      status: params.status,
      jobId: params.jobId ? Number(params.jobId) : undefined,
    }),
  );
  const [detail, setDetail] = useState<JobLogVO | null>(null);
  const [seededJobId, setSeededJobId] = useState<string | null>(null);
  const skipJobIdFetch = useRef(true);

  if (jobId && jobId !== seededJobId) {
    crud.form.setFieldsValue({ jobId: Number(jobId) });
    setSeededJobId(jobId);
  } else if (!jobId && seededJobId !== null) {
    setSeededJobId(null);
  }

  useEffect(() => {
    if (skipJobIdFetch.current) {
      skipJobIdFetch.current = false;
      return;
    }
    crud.getList();
  }, [jobId]);

  const handleBack = () => navigate(-1);

  return {
    ...crud,
    detail,
    setDetail,
    handleBack,
  };
}
