"use client";

import { useState } from "react";
import { SearchInput } from "./Input";
import { Icon } from "./Icon";

export interface TransferListItem {
  id: string;
  label: string;
}

export function TransferList<T extends TransferListItem>({
  available,
  selected,
  onMoveToSelected,
  onMoveToAvailable,
  renderSelectedExtra,
  availableTitle = "Available",
  selectedTitle = "Selected",
}: {
  available: T[];
  selected: T[];
  onMoveToSelected: (item: T) => void;
  onMoveToAvailable: (item: T) => void;
  renderSelectedExtra?: (item: T) => React.ReactNode;
  availableTitle?: string;
  selectedTitle?: string;
}) {
  const [searchAvailable, setSearchAvailable] = useState("");
  const [searchSelected, setSearchSelected] = useState("");

  const filteredAvailable = available.filter((i) =>
    i.label.toLowerCase().includes(searchAvailable.trim().toLowerCase()),
  );
  const filteredSelected = selected.filter((i) =>
    i.label.toLowerCase().includes(searchSelected.trim().toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
      <div className="flex flex-col gap-sm">
        <p className="text-label-md text-on-surface">{availableTitle}</p>
        <SearchInput
          placeholder="Search…"
          value={searchAvailable}
          onChange={(e) => setSearchAvailable(e.target.value)}
        />
        <div className="h-[220px] overflow-y-auto scroll-thin rounded-DEFAULT border border-hairline">
          {filteredAvailable.length === 0 ? (
            <p className="p-md text-caption-sm text-mute">No one available</p>
          ) : (
            filteredAvailable.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onMoveToSelected(item)}
                className="flex w-full items-center justify-between gap-sm px-md py-sm text-left text-body-sm text-on-surface hover:bg-surface-soft border-b border-hairline last:border-b-0"
              >
                <span className="truncate">{item.label}</span>
                <Icon name="chevron_right" size={18} className="shrink-0 text-mute" />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <p className="text-label-md text-on-surface">{selectedTitle}</p>
        <SearchInput
          placeholder="Search…"
          value={searchSelected}
          onChange={(e) => setSearchSelected(e.target.value)}
        />
        <div className="h-[220px] overflow-y-auto scroll-thin rounded-DEFAULT border border-hairline">
          {filteredSelected.length === 0 ? (
            <p className="p-md text-caption-sm text-mute">No one selected</p>
          ) : (
            filteredSelected.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-sm px-md py-sm border-b border-hairline last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onMoveToAvailable(item)}
                  className="flex items-center gap-sm flex-1 min-w-0 text-left text-body-sm text-on-surface hover:text-error"
                >
                  <Icon name="chevron_left" size={18} className="shrink-0 text-mute" />
                  <span className="truncate">{item.label}</span>
                </button>
                {renderSelectedExtra && (
                  <div className="w-[160px] shrink-0">{renderSelectedExtra(item)}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
