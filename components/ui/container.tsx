import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export default function Container({ className = "", children, ...props }: Props) {
  return (
    <div
      className={`max-w-4xl mx-auto px-6 py-10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
