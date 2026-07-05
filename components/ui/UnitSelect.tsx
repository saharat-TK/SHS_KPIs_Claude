"use client";

import { useMemo } from "react";
import { useUnits } from "@/lib/data/hooks";
import { Select } from "./Input";

const DEFAULT_UNIT = "Item";

type UnitSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange" | "children"
> & {
  value: string;
  onChange: (value: string) => void;
};

export function UnitSelect({
  value,
  onChange,
  disabled,
  ...rest
}: UnitSelectProps) {
  const units = useUnits();
  const selected = value.trim() || DEFAULT_UNIT;

  const options = useMemo(() => {
    const names = new Set<string>();
    const list: string[] = [];

    const add = (name: string) => {
      const clean = name.trim();
      if (!clean || names.has(clean)) return;
      names.add(clean);
      list.push(clean);
    };

    add(DEFAULT_UNIT);
    (units.data ?? []).forEach((unit) => add(unit.unitNameEn));
    add(selected);

    return list;
  }, [selected, units.data]);

  return (
    <Select
      {...rest}
      value={selected}
      disabled={disabled || units.isLoading || units.isError}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((unit) => (
        <option key={unit} value={unit}>
          {unit}
        </option>
      ))}
    </Select>
  );
}
