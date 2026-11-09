"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEFAULT_LIMITS = [8, 16, 24];
const ALLOWED_SORTS = new Set(["createdAt", "name"]);
const ALLOWED_ORDERS = new Set(["asc", "desc"]);

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function useUrlListState({
  filterKeys = [],
  allowedLimits = DEFAULT_LIMITS,
  defaultLimit = 8,
} = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filterKeySignature = filterKeys.join(",");
  const limitSignature = allowedLimits.join(",");

  const values = useMemo(() => {
    const filters = {};
    for (const key of filterKeySignature ? filterKeySignature.split(",") : []) {
      filters[key] = searchParams.get(key) ?? "";
    }

    const validLimits = limitSignature
      ? limitSignature.split(",").map((value) => Number(value))
      : DEFAULT_LIMITS;
    const requestedLimit = parsePositiveInteger(searchParams.get("limit"), defaultLimit);
    const limit = validLimits.includes(requestedLimit) ? requestedLimit : defaultLimit;
    const sortParam = searchParams.get("sort");
    const orderParam = searchParams.get("order");

    return {
      page: parsePositiveInteger(searchParams.get("page"), 1),
      limit,
      search: searchParams.get("search") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      sort: ALLOWED_SORTS.has(sortParam) ? sortParam : "createdAt",
      order: ALLOWED_ORDERS.has(orderParam) ? orderParam : "desc",
      ...filters,
    };
  }, [searchParams, filterKeySignature, limitSignature, defaultLimit]);

  const setParams = useCallback(
    (updates, { resetPage = true } = {}) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (resetPage && !("page" in updates)) {
        next.delete("page");
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { values, setParams };
}

export function buildListQuery(values, filterKeys = []) {
  const query = {
    page: values.page,
    limit: values.limit,
    sort: values.sort,
    order: values.order,
  };

  if (values.search) {
    query.search = values.search;
  }
  if (values.from) {
    query.from = values.from;
  }
  if (values.to) {
    query.to = values.to;
  }

  for (const key of filterKeys) {
    if (values[key]) {
      query[key] = values[key];
    }
  }

  return query;
}
