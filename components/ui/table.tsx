import { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className = "", children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table
        className={`w-full text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800" {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className="divide-y divide-gray-100 dark:divide-gray-800" {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = "", children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`group bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Th({ className = "", children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className = "", children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-4 py-3 text-gray-800 dark:text-gray-200 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
