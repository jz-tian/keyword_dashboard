import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function SkeletonCard({ height = 48 }: { height?: number }) {
  return (
    <Card>
      <CardContent className="pt-[var(--spacing-card)]">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Executive summary */}
      <Card className="border-l-2 border-l-[var(--color-accent)]">
        <CardContent className="pt-[var(--spacing-card)]">
          <Skeleton className="mb-2 h-3 w-36" />
          <Skeleton className="mb-1.5 h-4 w-full" />
          <Skeleton className="mb-1.5 h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-[var(--spacing-card)]">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="mb-1 h-8 w-16" />
              <Skeleton className="h-1.5 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart + related topics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard height={192} />
        <SkeletonCard height={192} />
      </div>

      {/* Sentiment + word cloud */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard height={176} />
        <SkeletonCard height={176} />
      </div>

      {/* News */}
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <Skeleton className="mb-4 h-3 w-28" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3"
              >
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* YouTube */}
      <Card>
        <CardContent className="pt-[var(--spacing-card)]">
          <Skeleton className="mb-4 h-3 w-24" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3"
              >
                <Skeleton className="h-16 w-28 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
