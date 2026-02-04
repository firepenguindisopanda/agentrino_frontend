"use client";
import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--ac-dark-void)]/80 border-b border-[var(--ac-card-border)]">
      <div className="flex flex-row items-center justify-between px-6 py-3">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--ac-electric-violet)] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-[var(--ac-electric-violet)] p-2.5 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--ac-electric-violet)]">
              Agent Chatter
            </span>
            <span className="text-[10px] text-[var(--ac-slate-gray)] -mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Conversations
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-[var(--ac-silver-mist)] hover:text-[var(--ac-electric-violet)] transition-colors"
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
