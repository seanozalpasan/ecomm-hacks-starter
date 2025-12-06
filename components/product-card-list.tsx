"use client";

import { type ProductResult } from "@/lib/api/searchGifts";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";

type ProductCardListProps = {
  products: ProductResult[];
  className?: string;
};

export function ProductCardList({
  products,
  className,
}: ProductCardListProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-6", className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.url || `${product.title}-${index}`}
          product={product}
        />
      ))}
    </div>
  );
}

