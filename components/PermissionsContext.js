import React, { createContext, useContext } from "react";

export const PermissionsContext = createContext([]);

export function usePermissions() {
  return useContext(PermissionsContext);
} 