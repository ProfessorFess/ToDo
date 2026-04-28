import { Check } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-1 select-none">
      <span className="text-[64px] leading-none font-normal tracking-tight text-neutral-600">
        TO
      </span>
      <span className="text-[64px] leading-none font-normal tracking-tight text-neutral-600">
        D
      </span>
      <span className="relative inline-flex items-center justify-center">
        <span
          className="inline-block rounded-full border-[5px] border-accent"
          style={{ width: "62px", height: "62px" }}
          aria-hidden
        />
        <Check
          className="absolute text-accent"
          strokeWidth={4}
          size={32}
          aria-hidden
        />
      </span>
    </div>
  );
}
