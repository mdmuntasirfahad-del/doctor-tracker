"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function usePublicDoctorOptions() {
  return useQuery({
    queryKey: queryKeys.public.doctorOptions,
    queryFn: ({ signal }) => api.get("/public/doctors/options", undefined, signal),
    staleTime: 60_000,
  });
}

export function useRegisterDoctor() {
  return useMutation({
    mutationFn: (body) => api.post("/public/registrations/doctors", body),
  });
}

export function useRegisterPatient() {
  return useMutation({
    mutationFn: (body) => api.post("/public/registrations/patients", body),
  });
}
