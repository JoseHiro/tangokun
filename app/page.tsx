"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import Card from "@/components/ui/card";

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  // Keep markup stable while session loads — don't flash landing to authed users
  if (status === "loading" || status === "authenticated") return null;

  return (
    <div className="max-w-[900px] mx-auto px-6">
      {/* ── Hero ── */}
      <section className="py-16 sm:py-24 space-y-8">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 leading-tight">
            Use the words<br />you learned.
          </h1>
          <p className="text-lg text-gray-400 dark:text-gray-500 leading-relaxed">
            Most students memorize vocabulary.<br />
            Very few actually use it.
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            Tango Kun turns your vocabulary into real Japanese sentences — then challenges you to translate them.
          </p>
        </div>
        <Link href="/login" className={buttonVariants("primary") + " text-sm"}>
          Start practicing
        </Link>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* ── How it works ── */}
      <section className="py-14 sm:py-20 space-y-12">
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            {
              step: "1",
              title: "Add your vocabulary",
              body: "Import words from your study list, or add them one by one.",
            },
            {
              step: "2",
              title: "Generate sentences",
              body: "AI creates natural Japanese sentences using your exact words.",
            },
            {
              step: "3",
              title: "Answer the meaning",
              body: "Practice actively — translate each sentence instead of just reading.",
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="space-y-3">
              <span className="text-2xl font-semibold text-green-500 dark:text-green-400">{step}</span>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* ── Example ── */}
      <section className="py-14 sm:py-20 space-y-8">
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          See it in action
        </h2>
        <div className="max-w-lg space-y-4">
          {/* Word chip */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Word
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-200">りんご</span>
              <span className="text-gray-400 dark:text-gray-500">apple</span>
            </span>
          </div>

          {/* Sentence card */}
          <Card>
            <p className="text-2xl text-gray-900 dark:text-gray-100 leading-relaxed mb-5">
              りんごを買わなければならない。
            </p>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              {/* Answer input mock */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                I need to buy an apple.
              </div>
              {/* Result */}
              <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 px-4 py-3">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Correct!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Great job using 〜なければならない.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-14 sm:py-20 border-t border-gray-100 dark:border-gray-800">
        <div className="space-y-4 max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Ready to use your words?
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Free to use. No setup required.
          </p>
          <Link href="/login" className={buttonVariants("primary") + " text-sm"}>
            Start practicing
          </Link>
        </div>
      </section>
    </div>
  );
}
