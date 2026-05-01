export function MatchSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-10 bg-secondary rounded" />
        <div className="h-3 w-16 bg-secondary rounded" />
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-secondary rounded-full shrink-0" />
          <div className="flex-1 h-4 bg-secondary rounded" />
          <div className="h-7 w-8 bg-secondary rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-secondary rounded-full shrink-0" />
          <div className="flex-1 h-4 bg-secondary rounded" />
          <div className="h-7 w-8 bg-secondary rounded" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="h-3 w-32 bg-secondary rounded" />
      </div>
    </div>
  );
}

export function LeagueSectionSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-32 bg-secondary rounded animate-pulse" />
        <div className="flex-1 h-px bg-border" />
        <div className="h-4 w-12 bg-secondary rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <MatchSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
