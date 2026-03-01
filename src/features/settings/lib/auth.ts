import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/features/settings/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const MAX_SESSION_IMAGE_URL_LENGTH = 1024;

function normalizeSessionImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const image = value.trim();
  if (!image) return undefined;
  if (image.startsWith("data:")) return undefined;
  if (image.length > MAX_SESSION_IMAGE_URL_LENGTH) return undefined;

  return image;
}

const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET is required for NextAuth configuration.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? user.avatarUrl ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }

      if (trigger === "update") {
        token.lastUpdated = Date.now();
      }

      // Force a fresh database fetch to ensure token is never stale
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { image: true },
        });

        token.picture = dbUser?.image || null;
        token.lastUpdated = Date.now(); // Invalidate any internal caches
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image =
          typeof token.picture === "string" ? normalizeSessionImage(token.picture) ?? null : null;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
