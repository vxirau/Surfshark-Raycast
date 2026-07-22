import { useCallback, useEffect, useRef, useState } from "react";
import { readStatus } from "../lib/pia";
import { AUTO_REGION, VpnStatus } from "../types";

const POLL_INTERVAL_MS = 2000;

const EMPTY: VpnStatus = { state: "Disconnected", regionId: AUTO_REGION };

export function useStatus(cliPath: string | undefined) {
  const [status, setStatus] = useState<VpnStatus>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!cliPath || inFlight.current) return;
    inFlight.current = true;
    try {
      setStatus(await readStatus(cliPath));
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  }, [cliPath]);

  useEffect(() => {
    if (!cliPath) return;
    void refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh, cliPath]);

  return { status, isLoading, refresh };
}
