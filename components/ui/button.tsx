import { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-black hover:bg-gray-400 text-white disabled:opacity-40",
  secondary:
    "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
  ghost:
    "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
  danger:
    "text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400",
};

const base =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed select-none";

/** Returns only the className string — use this for non-button elements (e.g. Link). */
export function buttonVariants(variant: ButtonVariant = "primary"): string {
  return `${base} ${variantStyles[variant]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`${base} ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
