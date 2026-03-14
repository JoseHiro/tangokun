import Container from "@/components/ui/container";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function PageContainer({ title, subtitle, children }: Props) {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {children}
    </Container>
  );
}
