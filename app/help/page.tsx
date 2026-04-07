"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import Container from "@/components/ui/container";

export default function HelpPage() {
  const { t } = useLanguage();

  return (
    <Container className="max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6"
      >
        {t("helpBackDashboard")}
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-10">
        {t("helpTitle")}
      </h1>
      <div className="space-y-10 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <section id="study-now" className="scroll-mt-8">
          <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            {t("helpSectionStudyNowTitle")}
          </h2>
          <p>{t("helpSectionStudyNowBody")}</p>
        </section>
        <section>
          <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            {t("helpSectionVocabTitle")}
          </h2>
          <p>{t("helpSectionVocabBody")}</p>
        </section>
        <section>
          <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            {t("helpSectionPracticeTitle")}
          </h2>
          <p>{t("helpSectionPracticeBody")}</p>
        </section>
      </div>
    </Container>
  );
}
