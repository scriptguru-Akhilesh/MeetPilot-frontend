"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    Calendar,
    BarChart3,
    LogOut,
    Moon,
    Sun,
} from "lucide-react";
import { clearToken } from "@/lib/auth";
import { useToast } from "@/components/useToast";

type NavItemProps = {
    icon: React.ReactNode;
    label: string;
    href?: string;
    active?: boolean;
    onClick?: () => void;
};

function NavItem({ icon, label, href, active, onClick }: NavItemProps) {
    const base =
        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 lg:w-full";

    const styles = active
        ? "bg-[var(--secondary)] !text-white font-bold shadow-sm [&_svg]:!text-white"
        : "text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] font-medium";

    const className = `${base} ${styles}`;

    if (href) {
        return (
            <Link href={href} className={className}>
                <span className={`flex h-5 w-5 items-center justify-center transition-transform duration-200 ${active ? "scale-105" : ""}`}>
                    {icon}
                </span>
                {/* Text labels hide on mobile dock, show fully on desktop */}
                <span className="hidden lg:inline">{label}</span>
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={className}>
            <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
            <span className="hidden lg:inline">{label}</span>
        </button>
    );
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof document === "undefined") return false;
        return document.documentElement.classList.contains("dark");
    });

    useEffect(() => {
        const savedTheme = window.localStorage.getItem("theme");
        const shouldUseDark =
            savedTheme === "dark" ||
            (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

        document.documentElement.classList.toggle("dark", shouldUseDark);
        const themeTimer = window.setTimeout(() => {
            setDarkMode(shouldUseDark);
        }, 0);

        return () => window.clearTimeout(themeTimer);
    }, []);

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    const signOut = () => {
        clearToken();
        setShowSignOutModal(false);
        showToast("Signed out successfully.", "success");
        router.push("/login");
    };

    const toggleTheme = () => {
        const nextTheme = !darkMode;
        setDarkMode(nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme);
        window.localStorage.setItem("theme", nextTheme ? "dark" : "light");
    };

    return (
        <>

            <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
                <nav className="flex items-center justify-around rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow)] backdrop-blur-lg">
                    <NavItem
                        icon={<Home size={20} className={isActive("/dashboard") ? "stroke-[2.5px]" : "stroke-2"} />}
                        label="Dashboard"
                        href="/dashboard"
                        active={isActive("/dashboard")}
                    />
                    <NavItem
                        icon={<Calendar size={20} className={isActive("/meetings") ? "stroke-[2.5px]" : "stroke-2"} />}
                        label="Meetings"
                        href="/meetings"
                        active={isActive("/meetings")}
                    />
                    <NavItem
                        icon={<BarChart3 size={20} className={isActive("/analytics") ? "stroke-[2.5px]" : "stroke-2"} />}
                        label="Analytics"
                        href="/analytics"
                        active={isActive("/analytics")}
                    />
                    {/* <NavItem
                        icon={<Settings size={20} className={isActive("/settings") ? "stroke-[2.5px]" : "stroke-2"} />}
                        label="Settings"
                        href="/settings"
                        active={isActive("/settings")}
                    /> */}
                </nav>
            </div>

            <aside className="
                hidden lg:flex
                sticky top-0 z-30 h-screen w-72 flex-col
                border-r border-[var(--border)]
                bg-[var(--card)]
                px-6 py-7 shadow-[var(--shadow)] backdrop-blur-xl
            ">
                {/* Logo Section */}
                <div className="mb-8 px-1">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-[var(--muted-bg)] transition-transform group-hover:scale-105">
                            <Image
                                src="/images/logo.png"
                                alt="MeetPilot Logo"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        <div className="flex flex-col min-w-0 " >
                            <span className="block truncate text-lg font-bold tracking-tight text-[var(--foreground)]">
                                meet<span className="text-[var(--primary)] font-extrabold">Pilot</span>
                            </span>
                            <span className="text-[10px] font-bold text-[var(--muted)]/80 tracking-widest uppercase mt-0.5">
                                AI Workspace
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Main Navigation links */}
                <div className="flex flex-col gap-1">
                    <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]/60">
                        Overview
                    </p>
                    <nav className="flex flex-col gap-1.5">
                        <NavItem
                            icon={<Home size={18} className={isActive("/dashboard") ? "stroke-[2.5px]" : "stroke-2"} />}
                            label="Dashboard"
                            href="/dashboard"
                            active={isActive("/dashboard")}
                        />
                        <NavItem
                            icon={<Calendar size={18} className={isActive("/meetings") ? "stroke-[2.5px]" : "stroke-2"} />}
                            label="Meetings"
                            href="/meetings"
                            active={isActive("/meetings")}
                        />
                        <NavItem
                            icon={<BarChart3 size={18} className={isActive("/analytics") ? "stroke-[2.5px]" : "stroke-2"} />}
                            label="Analytics"
                            href="/analytics"
                            active={isActive("/analytics")}
                        />
                        {/* <NavItem
                            icon={<Settings size={18} className={isActive("/settings") ? "stroke-[2.5px]" : "stroke-2"} />}
                            label="Settings"
                            href="/settings"
                            active={isActive("/settings")}
                        /> */}
                    </nav>
                </div>

            

                {/* Footer Status Widget & Actions */}
                <div className="mt-auto pt-6">

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--secondary)] hover:bg-[var(--muted-bg)]"
                    >
                        {/* LEFT */}
                        <span className="flex min-w-0 items-center gap-2.5">
                            <span className="shrink-0 text-[var(--muted)] group-hover:text-[var(--foreground)] transition">
                                {darkMode ? <Moon size={13} /> : <Sun size={13} />}
                            </span>

                            <span className="truncate">
                                {darkMode ? "Dark mode" : "Light mode"}
                            </span>
                        </span>

                        {/* RIGHT TOGGLE */}
                        <span className="relative flex h-5 w-9 shrink-0 items-center rounded-full border border-[var(--border)] bg-transparent">
                            <span
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--foreground)] transition-transform duration-200 ${darkMode ? "translate-x-4" : "translate-x-0.5"
                                    }`}
                            />
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowSignOutModal(true)}
                        className="mt-3 flex w-full items-center gap-2.5 cursor-pointer rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all duration-200 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>

            {showSignOutModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
                        <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">
                            Session
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                            Sign out?
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                            You will be returned to the login screen. Your current theme preference will stay saved on this device.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowSignOutModal(false)}
                                className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--secondary)]"
                            >
                                Stay signed in
                            </button>
                            <button
                                type="button"
                                onClick={signOut}
                                className="cursor-pointer rounded-lg border border-rose-200 bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
