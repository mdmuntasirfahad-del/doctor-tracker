"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

function invalidateDoctorData(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

export function useDoctors(filters) {
  return useQuery({
    queryKey: queryKeys.doctors.list(filters),
    queryFn: ({ signal }) => api.get("/doctors", filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: ({ signal }) => api.get(`/doctors/${id}`, undefined, signal),
    enabled: Boolean(id),
  });
}

export function useDoctorOptions(search) {
  return useQuery({
    queryKey: queryKeys.doctors.options(search),
    queryFn: ({ signal }) => api.get("/doctors/options", search ? { search } : undefined, signal),
    staleTime: 60_000,
  });
}

export function useDoctorPatients(id, filters) {
  return useQuery({
    queryKey: queryKeys.doctors.patients(id, filters),
    queryFn: ({ signal }) => api.get(`/doctors/${id}/patients`, filters, signal),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/doctors", body),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.doctors.detail(response.data.id), response.data);
      invalidateDoctorData(queryClient);
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.patch(`/doctors/${id}`, body),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.doctors.detail(response.data.id), response.data);
      invalidateDoctorData(queryClient);
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/doctors/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.doctors.detail(id) });
      invalidateDoctorData(queryClient);
    },
  });
}
