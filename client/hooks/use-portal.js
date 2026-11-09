"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useDoctorPortal() {
  return useQuery({
    queryKey: queryKeys.portal.doctor,
    queryFn: ({ signal }) => api.get("/portal/doctor", undefined, signal),
  });
}

export function useDoctorDashboard(range) {
  return useQuery({
    queryKey: queryKeys.portal.doctorDashboard(range),
    queryFn: ({ signal }) => api.get("/portal/doctor/dashboard", { range }, signal),
  });
}

export function useUpdateDoctorPortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => api.patch("/portal/doctor", body),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.portal.doctor, response);
    },
  });
}

export function useDoctorPortalPatients(filters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.portal.doctorPatients(filters),
    queryFn: ({ signal }) => api.get("/portal/doctor/patients", filters, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useDoctorPortalHistory(filters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.portal.doctorHistory(filters),
    queryFn: ({ signal }) => api.get("/portal/doctor/history", filters, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useRecordPatientOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, outcome }) =>
      api.post(`/portal/doctor/patients/${patientId}/treatment`, { outcome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function usePatientPortal() {
  return useQuery({
    queryKey: queryKeys.portal.patient,
    queryFn: ({ signal }) => api.get("/portal/patient", undefined, signal),
  });
}

export function usePatientDashboard(range) {
  return useQuery({
    queryKey: queryKeys.portal.patientDashboard(range),
    queryFn: ({ signal }) => api.get("/portal/patient/dashboard", { range }, signal),
  });
}

export function usePatientPortalHistory(filters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.portal.patientHistory(filters),
    queryFn: ({ signal }) => api.get("/portal/patient/history", filters, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useUpdatePatientPortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => api.patch("/portal/patient", body),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.portal.patient, response);
    },
  });
}

export function useChangePatientDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => api.patch("/portal/patient/doctor", body),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.portal.patient, response);
    },
  });
}
