"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@/lib/auth";

interface RoleContextValue {
  role: Role | null;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
});

export function RoleProvider({ children, initialRole }: { children: ReactNode; initialRole: Role | null }) {
  return (
    <RoleContext.Provider value={{ role: initialRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
