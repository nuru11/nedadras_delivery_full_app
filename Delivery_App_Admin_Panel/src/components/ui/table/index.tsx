import { ReactNode, HTMLAttributes } from "react";

// -------------------- FIXED --------------------
// TableRow now accepts all native <tr> props, including onClick
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
}

// TableCell props
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  title?: string; // Native title attribute for tooltip
}

// Table, TableHeader, TableBody props
interface TableProps {
  children: ReactNode;
  className?: string;
}
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

// -------------------- COMPONENTS --------------------
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full ${className}`}>{children}</table>;
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

// -------------------- FIXED TableRow --------------------
const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
};

// TableCell
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  title,
}) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag className={className} title={title}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
