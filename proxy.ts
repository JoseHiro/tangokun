export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/practice", "/vocab", "/vocab/:path*", "/progress", "/dashboard"],
};
