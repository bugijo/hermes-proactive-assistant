import type { ConnectionMode } from "@/services/hermes-service";
import { createContext, useContext } from "react";

export const ConnectionModeContext = createContext<ConnectionMode>("offline");

export function useConnectionMode() {
  return useContext(ConnectionModeContext);
}
