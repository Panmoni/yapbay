import React from "react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { VariantProps } from "class-variance-authority";

interface StatusBadgeProps extends Omit<React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>, "variant"> {
  children?: React.ReactNode;
  className?: string;
  showOnMobile?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  children = "Alfajores",
  className = "",
  showOnMobile = false,
  ...props
}) => {
  return (
    <Badge
      variant="secondary"
      className={`bg-primary-100 text-primary-700 text-[10px] uppercase font-semibold ${
        showOnMobile ? "" : "hidden sm:inline-flex"
      } ${className}`}
      {...props}
    >
      {children}
    </Badge>
  );
};

export default StatusBadge;
