import { useEffect } from "react";
import { useCachedPromise } from "@raycast/utils";
import { detectSetup } from "../lib/pia";
import { SetupState } from "../types";

const REVALIDATE_MS = 5000;
const INITIAL: SetupState = { stage: "checking" };

export function useSetup() {
  const result = useCachedPromise(detectSetup, [], {
    keepPreviousData: true,
    initialData: INITIAL,
  });

  useEffect(() => {
    const id = setInterval(() => void result.revalidate(), REVALIDATE_MS);
    return () => clearInterval(id);
  }, [result]);

  return result.data ?? INITIAL;
}
