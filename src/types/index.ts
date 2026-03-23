import type { Role } from "@prisma/client";
import "next-auth";

// NextAuth の型拡張
declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

// シート関連の型
export type SheetColumn = string;

export type RowData = Record<string, string>;

export interface CellChange {
  rowId: string;
  columnKey: string;
  oldValue: string | null;
  newValue: string | null;
}
