"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function SplashScreen({
    onDone,
}: {
    onDone: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDone();
        }, 2000);

        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[var(--background)] p-4 select-none">
            {/* Main Content Wrapper */}
            <div className="flex flex-col items-center text-center space-y-9 max-w-sm">

                {/* LOGO */}
                <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-[var(--foreground)] text-[var(--background)] shadow-2xl transition-transform hover:scale-105 duration-300">
                    <Image
                        src="/images/logo.png"
                        alt="MeetPilot Logo"
                        width={72}
                        height={72}
                        className="object-contain"
                    />

                    {/* GREEN DOT */}
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 shadow-md"></span>
                    </span>
                </div>

                {/* TEXT */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                        MeetPilot
                    </h1>
                    <p className="text-sm font-medium tracking-wide text-[var(--muted)] uppercase opacity-80">
                        AI Meeting Workspace
                    </p>
                </div>

                {/* THREE DOTS BOUNCE ANIMATION */}
                <div className="flex items-center space-x-2.5 pt-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-bounce" />
                </div>

                {/* PREMIUM CREDITS SECTION - Right under the loading dots */}
                <div className="flex flex-col items-center space-y-3 pt-4 w-full">
                    {/* Subtle micro-divider line */}
                    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[var(--muted)] to-transparent opacity-30" />

                    <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-[var(--muted)]">
                        Developed by{" "}
                        <span className="relative inline-block font-bold text-cyan-300">
                            <span className="absolute inset-0 bg-cyan-400 blur-md opacity-40"></span>
                            <span className="relative">Dhananjay</span>
                        </span>{" "}
                        &{" "}
                        <span className="relative inline-block font-bold text-violet-300">
                            <span className="absolute inset-0 bg-violet-400 blur-md opacity-40"></span>
                            <span className="relative">Akhilesh</span>
                        </span>
                    </p>
                </div>

            </div>
        </div>
    );
}