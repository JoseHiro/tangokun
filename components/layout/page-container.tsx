import type { ReactNode } from "react";
import Container from "@/components/ui/container";

type Props = {
  title: string;
  subtitle?: string;
  /** Shown inline after the title (e.g. help button) */
  titleAddon?: ReactNode;
  /** Right side of the title row (e.g. primary actions) */
  headerActions?: ReactNode;
  children: React.ReactNode;
};

export default function PageContainer({ title, subtitle, titleAddon, headerActions, children }: Props) {
  return (
    <Container>
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
            {titleAddon}
          </div>
          {headerActions ? (
            <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
          ) : null}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {children}
    </Container>
  );
}
