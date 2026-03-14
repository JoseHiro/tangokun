import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";
// import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // --- Uncomment when API keys are ready ---
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    // Nodemailer({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM ?? "noreply@tangokun.app",
    // }),

    // Dev-mode login: sign in with any email, auto-creates the user
    Credentials({
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async ({ email }) => {
        if (!email || typeof email !== "string") return null;
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });
        return user;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // Persist the user id into the JWT on first sign-in
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      // Forward the user id from the JWT to the session object
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
