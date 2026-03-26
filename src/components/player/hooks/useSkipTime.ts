import { useEffect, useState } from "react";

import { usePlayerMeta } from "@/components/player/hooks/usePlayerMeta";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";

// Thanks Nemo for this API
const BASE_URL = "https://skips.pstream.org";
const MAX_RETRIES = 3;

export function useSkipTime() {
  const { playerMeta: meta } = usePlayerMeta();
  const [skiptime, setSkiptime] = useState<number | null>(null);
  const febboxToken = useAuthStore((s) => s.febboxToken);

  useEffect(() => {
    const fetchSkipTime = async (retries = 0): Promise<void> => {
      // Disabled since skips.pstream.org is dead
      setSkiptime(null);
    };

    fetchSkipTime();
  }, [
    meta?.tmdbId,
    meta?.imdbId,
    meta?.type,
    meta?.season?.number,
    meta?.episode?.number,
    febboxToken,
  ]);

  return skiptime;
}
