"use client";

import React, { ReactNode } from "react";
import Image from "next/image";

interface UrnaContainerProps {
  children: ReactNode;
  headerTitle?: string;
  footer?: ReactNode;
}

export const UrnaContainer: React.FC<UrnaContainerProps> = ({
  children,
  headerTitle = "JUSTIÇA ELEITORAL",
  footer,
}) => {
  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden bg-zinc-900 flex items-center justify-center p-1 sm:p-3 md:p-6 select-none">
      <div className="w-full max-w-5xl h-full max-h-[820px] bg-zinc-300 rounded-md sm:rounded-lg p-2 sm:p-4 md:p-6 shadow-2xl border-2 sm:border-4 border-zinc-400 urna-bevel-casing flex flex-col justify-between overflow-hidden">
        {/* Top Header of Urna */}
        <header className="flex items-center justify-between pb-1 sm:pb-2 mb-1 sm:mb-2 border-b sm:border-b-2 border-zinc-400 shrink-0">
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0">
              <Image
                src="/assets/images/brasao.png"
                alt="Brasão da República"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-[11px] sm:text-sm md:text-base font-black tracking-wider sm:tracking-widest text-zinc-800 uppercase">
                {headerTitle}
              </h1>
              <p className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-zinc-600 tracking-wider">
                COMMIT JUNIOR ELEIÇÕES
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-mono font-bold bg-zinc-800 text-zinc-100 px-1.5 sm:px-2 py-0.5 rounded">
              TERMINAL DO ELEITOR
            </span>
          </div>
        </header>

        {/* Main Body (LCD on Left / Keypad on Right) */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-1.5 sm:gap-3 md:gap-6 min-h-0 overflow-hidden">
          {children}
        </main>

        {/* Bottom Footer / Colinha */}
        {footer && (
          <footer className="mt-1 pt-1 sm:mt-2 sm:pt-1.5 border-t border-zinc-400 shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
