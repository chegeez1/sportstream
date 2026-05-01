import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

interface Param {
  name: string;
  label: string;
  placeholder?: string;
  default?: string;
  type?: "path" | "query";
}

interface TryItProps {
  method: "GET";
  url: string;
  params?: Param[];
}

export function TryIt({ method, url, params = [] }: TryItProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(params.map((p) => [p.name, p.default ?? ""]))
  );
  const [result, setResult] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = () => {
    let built = url;
    const queryParams: string[] = [];
    for (const p of params) {
      if (p.type === "path" || !p.type) {
        built = built.replace(`:${p.name}`, values[p.name] || p.default || "");
      } else {
        if (values[p.name]) {
          queryParams.push(`${p.name}=${encodeURIComponent(values[p.name])}`);
        }
      }
    }
    if (queryParams.length) built += "?" + queryParams.join("&");
    return built;
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(buildUrl());
      const text = await res.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResult({ status: res.status, body });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const builtUrl = buildUrl();
  const statusColor =
    result?.status && result.status < 300
      ? "text-emerald-400"
      : result?.status && result.status < 500
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="mt-4 border border-border rounded-xl overflow-hidden">
      <div className="bg-sidebar px-4 py-3 border-b border-border flex items-center gap-3">
        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">{method}</span>
        <code className="text-xs text-muted-foreground font-mono flex-1 truncate">{builtUrl}</code>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {loading ? "Running..." : "Try it"}
        </button>
      </div>

      {params.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-card/50 grid grid-cols-1 gap-2">
          {params.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <label className="text-xs font-mono text-muted-foreground w-28 shrink-0">
                {p.name}
                {p.type === "query" && <span className="text-muted-foreground/50 ml-1">?</span>}
              </label>
              <input
                type="text"
                value={values[p.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                placeholder={p.placeholder ?? p.default ?? ""}
                className="flex-1 text-xs bg-input border border-border rounded px-2.5 py-1.5 font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      )}

      {(result || error) && (
        <div className="p-4 bg-[hsl(220_18%_6%)]">
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          {result && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold font-mono ${statusColor}`}>
                  {result.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {result.status < 300 ? "OK" : result.status < 500 ? "Client Error" : "Server Error"}
                </span>
              </div>
              <pre className="text-[0.75rem] leading-relaxed overflow-x-auto text-foreground font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                {result.body}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
