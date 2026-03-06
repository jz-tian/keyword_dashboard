"use client";

import { Monitor, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isBloomberg = theme === "bloomberg";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="gap-1.5 text-xs"
      title={`Switch to ${isBloomberg ? "Apple Intelligence" : "Bloomberg"} theme`}
    >
      {isBloomberg ? (
        <>
          <Monitor className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Apple</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bloomberg</span>
        </>
      )}
    </Button>
  );
}
