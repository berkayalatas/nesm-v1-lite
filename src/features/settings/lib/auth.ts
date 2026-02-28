import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/features/settings/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.picture = normalizeSessionImage(user.image);
      }

      const updatedImage =
        trigger === "update"
          ? normalizeSessionImage(session?.image ?? (session?.user as { image?: unknown } | undefined)?.image)
          : undefined;
      if (updatedImage) {
        token.picture = updatedImage;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            image: true,
            avatarUrl: true,
            name: true,
            email: true,
            role: true,
          },
        });

        if (dbUser) {
          token.picture = normalizeSessionImage(dbUser.image ?? dbUser.avatarUrl);
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = normalizeSessionImage(token.picture) ?? null;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
