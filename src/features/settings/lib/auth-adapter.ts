import bcrypt from "bcrypt";
import type { Session } from "@prisma/client";

import { prisma } from "@/features/settings/lib/prisma";

export interface SecurityAuthAdapter {
  verifyPassword(password: string, hash: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  listSessions(userId: string): Promise<Session[]>;
  revokeSession(sessionToken: string): Promise<void>;
  logoutAllOtherSessions(userId: string, currentToken: string): Promise<void>;
}

const BCRYPT_ROUNDS = 12;

const prismaSecurityAuthAdapter: SecurityAuthAdapter = {
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  async listSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async revokeSession(sessionToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  },

  async logoutAllOtherSessions(userId: string, currentToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
        sessionToken: {
          not: currentToken,
        },
      },
    });
  },
};

let securityAuthAdapter: SecurityAuthAdapter = prismaSecurityAuthAdapter;

export function setSecurityAuthAdapter(adapter: SecurityAuthAdapter): void {
  securityAuthAdapter = adapter;
}

export function getSecurityAuthAdapter(): SecurityAuthAdapter {
  return securityAuthAdapter;
}
