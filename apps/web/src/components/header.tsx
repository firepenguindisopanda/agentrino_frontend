"use client";
import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 dark:bg-[var(--ac-dark-bg)]/80 border-b border-border dark:border-[var(--ac-border-color)]">
      <div className="flex flex-row items-center justify-between px-6 py-3">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative hidden dark:block">
            <div className="absolute inset-0 bg-[var(--ac-primary-blue)] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-[var(--ac-primary-blue)] p-2.5 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="relative dark:hidden">
            <div className="relative bg-[var(--ac-primary-blue)] p-2.5 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--ac-primary-blue)]">
              Agentrino
            </span>
            <span className="text-[10px] text-muted-foreground dark:text-[var(--ac-text-secondary)] -mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Conversations
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-muted-foreground dark:text-[var(--ac-text-secondary)] hover:text-[var(--ac-primary-blue)] dark:hover:text-[var(--ac-primary-blue)] transition-colors"
          >
            Agents
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
