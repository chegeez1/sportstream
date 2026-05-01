import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

function highlight(code: string, lang: string): string {
  if (lang === "json") {
    return code
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="token-key">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="token-string">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="token-number">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="token-keyword">$1</span>')
      .replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
  }
  if (lang === "js" || lang === "javascript") {
    return code
      .replace(/\b(const|let|var|function|return|new|if|else|async|await)\b/g, '<span class="token-keyword">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="token-string">$1</span>')
      .replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
  }
  if (lang === "bash" || lang === "shell") {
    return code
      .replace(/^(\$\s)/gm, '<span class="token-keyword">$1</span>')
      .replace(/(#.*)/g, '<span class="token-comment">$1</span>');
  }
  return code;
}

export function CodeBlock({ code, language = "json", title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-sidebar border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground font-mono">{title}</span>
          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">{language}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="p-4 overflow-x-auto text-[0.8rem] leading-relaxed bg-[hsl(220_18%_6%)]">
          <code
            dangerouslySetInnerHTML={{ __html: highlight(code, language) }}
            className="font-mono"
          />
        </pre>
        <button
          onClick={copy}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
