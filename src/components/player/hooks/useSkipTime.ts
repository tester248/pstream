import { useState } from "react";

export function useSkipTime() {
  const [skiptime] = useState<number | null>(null);

  return skiptime;
}
