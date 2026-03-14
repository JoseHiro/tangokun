import { InputHTMLAttributes } from "react";

/** The base input className — also exported for use on <textarea>. */
export const inputClassName =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 focus:border-green-500 transition";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: Props) {
  return <input className={`${inputClassName} ${className}`} {...props} />;
}
