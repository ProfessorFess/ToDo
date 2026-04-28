import { useState, type FormEvent } from "react";

type TaskInputProps = {
  onAdd: (text: string) => void;
};

export function TaskInput({ onAdd }: TaskInputProps) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center bg-input-bg rounded-full overflow-hidden shadow-sm"
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="What do you need to do?"
        aria-label="New task"
        className="flex-1 bg-transparent px-7 py-4 text-[18px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-add-bg text-white font-bold tracking-widest text-[18px] px-8 py-4 rounded-full disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-95 transition"
      >
        ADD
      </button>
    </form>
  );
}
