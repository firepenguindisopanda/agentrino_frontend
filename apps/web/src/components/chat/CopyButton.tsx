'use client';
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/** Small copy-to-clipboard button with transient "copied" feedback. */
export function CopyButton({ text, label = 'Copy', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (insecure context / denied permission).
      // Fail silently rather than breaking the UI.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${className}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}
