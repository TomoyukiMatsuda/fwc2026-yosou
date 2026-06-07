"use client";

import { useEffect } from "react";

/** 画面下に一時表示するトースト（key で再マウントして毎回タイマー起動）。 */
export function Toast({
  message,
  onDone,
  duration = 2600,
}: {
  message: string;
  onDone: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-4">
      <div className="max-w-md rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft-lg">
        {message}
      </div>
    </div>
  );
}
