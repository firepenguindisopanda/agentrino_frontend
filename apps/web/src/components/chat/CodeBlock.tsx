'use client';
import React, { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Custom <pre> renderer for markdown code blocks: adds a hover copy button and
 * lets the highlight.js theme style the inner <code class="hljs">. Reads the
 * rendered text from the DOM so it copies exactly what the user sees.
 */
export function CodeBlock({ children, className = '', ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = preRef.current?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures (insecure context / denied permission).
    }
  };

  return (
    <div className="group relative my-3">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        title={copied ? 'Copied' : 'Copy code'}
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-xs text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground focus:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--ac-primary-blue)] group-hover:opacity-100"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre ref={preRef} className={`code-block ${className}`} {...props}>
        {children}
      </pre>
    </div>
  );
}
