"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardSummary(range) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(range),
    queryFn: ({ signal }) => api.get("/dashboard/summary", { range }, signal),
  });
}

export function usePatientsPerDoctor() {
  return useQuery({
    queryKey: queryKeys.dashboard.workload,
    queryFn: ({ signal }) => api.get("/dashboard/patients-per-doctor", undefined, signal),
  });
}

export function usePatientsOverTime(range) {
  return useQuery({
    queryKey: queryKeys.dashboard.overTime(range),
    queryFn: ({ signal }) => api.get("/dashboard/patients-over-time", { range }, signal),
  });
}
