import { useQuery } from "@tanstack/react-query";
import { hermesService } from "@/services/hermes-service";

export function useHermesSnapshot() {
  return useQuery({ queryKey: ["hermes", "snapshot"], queryFn: () => hermesService.getSnapshot() });
}
