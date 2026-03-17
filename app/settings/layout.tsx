"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Database } from "lucide-react";

const NAV_ITEMS = [
  { href: "/settings/profile", label: "Profile", Icon: User },
  { href: "/settings/account", label: "Account", Icon: Shield },
  { href: "/settings/data", label: "Data", Icon: Database },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6"
      >
        ← Back
      </Link>

      {/* Page heading */}
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Settings
      </h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar / Tab strip */}
        <nav className="sm:w-44 shrink-0">
          {/* Mobile: horizontal scroll row */}
          <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
