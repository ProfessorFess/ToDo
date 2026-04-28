import type { Tab } from "../types/task";

type TabBarProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "professional", label: "Professional" },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="grid grid-cols-2 w-full">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-pressed={isActive}
            className={[
              "py-4 text-[22px] font-bold transition-colors",
              "border-b-[3px]",
              isActive
                ? "text-neutral-900 border-accent"
                : "text-neutral-400 border-transparent hover:text-neutral-600",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
