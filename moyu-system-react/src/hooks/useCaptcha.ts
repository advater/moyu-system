import { useCallback, useEffect, useState } from "react";
import { getCaptcha } from "@/api/login";
import { env } from "@/config/env";

export function isCaptchaRequiredError(error: any) {
  const code = String(error?.errorCode || "");
  return (
    code === "AUTH.CAPTCHA_REQUIRED" ||
    code === "TENANT.PROBE_CAPTCHA_REQUIRED" ||
    code === "CAPTCHA.PARAM_MISSING" ||
    code === "CAPTCHA.EXPIRED" ||
    code === "CAPTCHA.WRONG"
  );
}

/** 图形验证码：env 开启，或登录失败后后端要求补填 */
export function useCaptcha(force = false) {
  const enabled = env.captchaEnable || force;
  const [image, setImage] = useState("");
  const [uuid, setUuid] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const data = await getCaptcha();
    setUuid(data.uuid);
    setImage(data.image);
  }, [enabled]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) void refresh().catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { enabled, image, uuid, refresh };
}
