import { useCallback, useState } from "react";

/**
 * Derive a loading flag for a keyed in-flight request without calling setState
 * synchronously inside useEffect.
 *
 * When `pendingKey` becomes null (e.g. a modal closes), the completed key is
 * reset during render so the next open of the same id shows loading again.
 */
export function usePendingOpen(pendingKey: string | null) {
  const [completedKey, setCompletedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (pendingKey === null && completedKey !== null) {
    setCompletedKey(null);
  }

  const loading = submitting || (pendingKey !== null && completedKey !== pendingKey);

  const completePending = useCallback((key: string) => {
    setCompletedKey(key);
  }, []);

  return { loading, setSubmitting, completePending, pendingKey };
}