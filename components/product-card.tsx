"use client";

import { type ProductResult } from "@/lib/api/searchGifts";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductResult;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${product.title}`}
      className={cn(
        "group block p-4 rounded-lg border border-border bg-card hover:border-ring hover:shadow-md transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="flex gap-4">
        {product.imageUrl ? (
          <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(event) => {
                const target = event.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="shrink-0 w-24 h-24 rounded-md bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-base group-hover:text-ring transition-colors line-clamp-2">
              {product.title}
            </h3>
            {product.category && (
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {product.category}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{product.price}</span>
            <span className="text-xs text-muted-foreground group-hover:text-ring transition-colors">
              View product →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

