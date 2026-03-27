import NextAuth from "next-auth"
import type { Session } from "next-auth"
import type { NextRequest } from "next/server"
import Google from "next-auth/providers/google"
import Kakao from "next-auth/providers/kakao"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: {
    strategy: "database" as const,
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, user }: any) {
      if (session?.user) {
        session.user.id = user.id
        session.user.role = user.role || "user"
      }
      return session
    },
  },
})

export const handlers: { GET: (req: NextRequest) => Promise<Response>; POST: (req: NextRequest) => Promise<Response> } = nextAuth.handlers
export const auth: () => Promise<Session | null> = nextAuth.auth
export const signIn: (...args: unknown[]) => Promise<unknown> = nextAuth.signIn as (...args: unknown[]) => Promise<unknown>
export const signOut: (...args: unknown[]) => Promise<unknown> = nextAuth.signOut as (...args: unknown[]) => Promise<unknown>
