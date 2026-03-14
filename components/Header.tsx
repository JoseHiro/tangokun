"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe, Sun, Moon, LogOut, LayoutDashboard, BookOpen, PenLine, TrendingUp } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import type { LucideIcon } from "lucide-react";

type NavLink = {
  href: string;
  labelKey: "dashboard" | "vocab" | "practice" | "progress";
  Icon: LucideIcon;
};

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", labelKey: "dashboard", Icon: LayoutDashboard },
  { href: "/vocab",     labelKey: "vocab",      Icon: BookOpen },
  { href: "/practice",  labelKey: "practice",   Icon: PenLine },
  { href: "/progress",  labelKey: "progress",   Icon: TrendingUp },
];

export default function Header() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: logo + nav (nav only when signed in) */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={session?.user ? "/dashboard" : "/"}
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight shrink-0"
          >
            {t("appName")}
          </Link>

          {session?.user && (
            <nav className="flex items-center gap-0.5">
              {NAV_LINKS.map(({ href, labelKey, Icon }) => {
                const active = pathname === href;
                const base = `flex items-center gap-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`;
                return (
                  <Link key={href} href={href} title={t(labelKey)}>
                    {/* Mobile: icon only */}
                    <span className={`${base} px-2 py-1.5 sm:hidden`}>
                      <Icon size={16} />
                    </span>
                    {/* Desktop: text only */}
                    <span className={`${base} hidden sm:flex px-3 py-1.5 text-sm`}>
                      {t(labelKey)}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: lang + theme + user */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setLanguage(language === "en" ? "jp" : "en")}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={language === "en" ? "Switch to Japanese" : "英語に切り替え"}
          >
            <Globe size={14} />
            <span className="font-medium text-xs">{language === "en" ? "EN" : "JP"}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {session?.user ? (
            <div className="flex items-center gap-0.5 ml-1 pl-2 border-l border-gray-100 dark:border-gray-800">
              <UserAvatar name={session.user.name} image={session.user.image} />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={t("signOut")}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-1 pl-2 border-l border-gray-100 dark:border-gray-800 px-2.5 py-1.5 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <Image src={image} alt={name ?? "User"} width={26} height={26} className="rounded-full" />
    );
  }
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="w-[26px] h-[26px] rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
      <span className="text-xs font-semibold text-green-700 dark:text-green-400">{initials}</span>
    </div>
  );
}
