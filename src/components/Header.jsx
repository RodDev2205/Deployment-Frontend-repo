// src/components/common/Header.js
import React from "react";

import { useState, useEffect } from "react";

export default function Header({
  title = "Food Paradise: Super Admin Access",
  initials = "R",
}) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setClock(formatted);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between p-4 shadow-md bg-gradient-to-r from-green-700 to-green-800 text-white w-full">
      {/* App Title */}
      <h1 className="text-2xl font-semibold">{title}</h1>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {clock && <div>{clock}</div>}

        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="h-10 w-10 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}