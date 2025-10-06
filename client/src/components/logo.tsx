
import { Coins } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl", 
    lg: "text-3xl"
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Coins className={`${iconSizes[size]} text-purple-400`} />
        <div className="absolute -inset-1 bg-purple-400/20 rounded-full blur-sm" />
      </div>
      <span className={`font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent ${sizeClasses[size]}`}>
        NFTSol
      </span>
    </div>
  );
}
