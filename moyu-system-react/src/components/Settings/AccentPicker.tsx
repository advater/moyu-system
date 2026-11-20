import { useState } from "react";
import { ACCENT_COLORS, useAppStore } from "@/store/stores/app";
import "./AccentPicker.scss";

export default function AccentPicker() {
  const { theme, setAccent } = useAppStore();
  const value = theme.elColorPrimary;
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }

  return (
    <div className="accent-picker">
      <label className="accent-picker-field">
        <input type="color" value={value} onChange={(event) => setAccent(event.target.value)} />
        <input
          type="text"
          value={text}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim();
            setText(next);
            if (/^#([0-9a-fA-F]{6})$/.test(next)) setAccent(next);
          }}
        />
      </label>
      <div className="accent-picker-presets">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`accent-swatch ${value === color ? "is-active" : ""}`}
            style={{ background: color }}
            onClick={() => setAccent(color)}
          />
        ))}
      </div>
    </div>
  );
}
