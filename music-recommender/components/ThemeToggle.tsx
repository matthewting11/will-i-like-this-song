"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ThemeToggle() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setEnabled(false);
    } else {
      document.documentElement.classList.add("dark");
      setEnabled(true);
    }

    setMounted(true);
  }, []);

  function handleToggle(checked: boolean) {
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    setEnabled(checked);
  }

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-3">
      <Sun
        size={18}
        className={!enabled ? "text-yellow-500" : "text-zinc-500"}
      />

      <Switch checked={enabled} onCheckedChange={handleToggle} />

      <Moon
        size={18}
        className={enabled ? "text-indigo-400" : "text-zinc-500"}
      />
    </div>
  );
}