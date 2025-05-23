import * as React from "react";

import { cn } from "@/lib/utils";
import { AnimatedGradientBorderTW } from "../animated-border-gradient";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        `border border-zinc-200 placeholder:text-muted-foreground
      
          focus-visible:border-zinc-300 focus-visible:ring-zinc-200/60
      
          focus-visible:ring-[2px] focus-visible:shadow-[0_0_0_4px_rgba(180,180,190,0.18)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
