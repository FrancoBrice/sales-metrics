import { TbSparkles } from "react-icons/tb";

interface SparkleIconProps {
  className?: string;
}

export function SparkleIcon({ className }: SparkleIconProps) {
  return <TbSparkles className={className} size={14} />;
}
