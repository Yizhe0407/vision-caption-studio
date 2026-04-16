"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          border: "1px solid #e4e4e7",
          borderRadius: "12px",
          background: "#ffffff",
          color: "#18181b",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        },
      }}
    />
  );
}
