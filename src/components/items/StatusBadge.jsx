import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  matched: { label: "Matched", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  resolved: { label: "Resolved", className: "bg-blue-100 text-blue-700 border-blue-200" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.active;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}