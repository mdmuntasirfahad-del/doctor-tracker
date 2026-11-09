"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

function invalidateRegistrationData(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.registrationRequests.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

export function useRegistrationRequests(filters = {}) {
  return useQuery({
    queryKey: queryKeys.registrationRequests.list(filters),
    queryFn: ({ signal }) => api.get("/registration-requests", filters, signal),
  });
}

export function useApproveRegistrationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/registration-requests/${id}/approve`),
    onSuccess: () => invalidateRegistrationData(queryClient),
  });
}

export function useDeleteRegistrationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/registration-requests/${id}`),
    onSuccess: () => invalidateRegistrationData(queryClient),
  });
}
