"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

function invalidatePatientData(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

export function usePatients(filters) {
  return useQuery({
    queryKey: queryKeys.patients.list(filters),
    queryFn: ({ signal }) => api.get("/patients", filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: ({ signal }) => api.get(`/patients/${id}`, undefined, signal),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/patients", body),
    onSuccess: () => invalidatePatientData(queryClient),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.patch(`/patients/${id}`, body),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.patients.detail(response.data.id), response.data);
      invalidatePatientData(queryClient);
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/patients/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.patients.detail(id) });
      invalidatePatientData(queryClient);
    },
  });
}
