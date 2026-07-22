"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth";

interface RoleContextValue {
  role: Role | null;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
});

function readRoleCookie(): Role | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)role=(ADMIN|VIEWER)/);
  return match ? (match[1] as Role) : null;
}

export function RoleProvider({ children, initialRole }: { children: ReactNode; initialRole: Role | null }) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const pathname = usePathname();

  useEffect(() => {
    setRole(readRoleCookie());
  }, [pathname]);

  return (
    <RoleContext.Provider value={{ role }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
