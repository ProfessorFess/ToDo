import { Trash2 } from "lucide-react";

type ClearCompletedButtonProps = {
  onClear: () => void;
  disabled?: boolean;
};

export function ClearCompletedButton({
  onClear,
  disabled = false,
}: ClearCompletedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={disabled}
      className="inline-flex items-center gap-2 text-accent text-[14px] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
    >
      <Trash2 size={16} />
      <span>Clear Completed</span>
    </button>
  );
}
