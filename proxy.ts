export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/practice", "/vocab", "/vocab/:path*", "/progress", "/dashboard"],
};
