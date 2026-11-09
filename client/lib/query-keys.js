export const queryKeys = {
  doctors: {
    all: ["doctors"],
    list: (filters) => ["doctors", "list", filters],
    detail: (id) => ["doctors", "detail", id],
    options: (search) => ["doctors", "options", search ?? ""],
    patients: (id, filters) => ["doctors", "patients", id, filters],
  },
  patients: {
    all: ["patients"],
    list: (filters) => ["patients", "list", filters],
    detail: (id) => ["patients", "detail", id],
  },
  registrationRequests: {
    all: ["registration-requests"],
    list: (filters) => ["registration-requests", "list", filters],
  },
  dashboard: {
    all: ["dashboard"],
    summary: (range) => ["dashboard", "summary", range],
    workload: ["dashboard", "workload"],
    overTime: (range) => ["dashboard", "over-time", range],
  },
  public: {
    all: ["public"],
    doctorOptions: ["public", "doctor-options"],
  },
  portal: {
    all: ["portal"],
    doctor: ["portal", "doctor"],
    doctorDashboard: (range) => ["portal", "doctor", "dashboard", range],
    doctorPatients: (filters) => ["portal", "doctor", "patients", filters],
    doctorHistory: (filters) => ["portal", "doctor", "history", filters],
    patient: ["portal", "patient"],
    patientDashboard: (range) => ["portal", "patient", "dashboard", range],
    patientHistory: (filters) => ["portal", "patient", "history", filters],
  },
};
