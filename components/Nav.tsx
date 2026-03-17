"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

export default function Nav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { href: "/vocab", label: t("vocab") },
    { href: "/practice", label: t("practice") },
  ];

  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 tracking-tight">
          <Image src="/webp/tangokun_icon.webp" alt="" width={22} height={22} className="rounded-sm" />
          単語くん
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === href
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
