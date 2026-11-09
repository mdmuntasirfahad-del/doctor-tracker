import { z } from "zod";

export const SPECIALIZATIONS = [
  "Cardiology",
  "General medicine",
  "Pediatrics",
  "Neurology",
  "Dermatology",
  "Orthopedics",
  "Endocrinology",
  "Pulmonology",
  "Gastroenterology",
  "Psychiatry",
  "Ophthalmology",
  "Otolaryngology",
];

export const HOSPITALS = [
  "Riverside Hospital",
  "Oakwood Medical Center",
  "Northgate Hospital",
  "Summit Clinic",
];

export const CONDITIONS = [
  "Hypertension",
  "Type 2 diabetes",
  "Eczema",
  "Asthma",
  "Migraine",
  "Arthritis",
  "Arrhythmia",
  "Allergic rhinitis",
  "Chronic bronchitis",
  "Gastritis",
  "Hypothyroidism",
  "Osteoporosis",
  "Psoriasis",
  "Anxiety disorder",
];

export const GENDERS = ["male", "female", "other"];

export const GENDER_LABELS = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const objectIdSchema = z.string().trim().regex(OBJECT_ID_PATTERN, "Invalid identifier.");

export const idParamsSchema = z.object({ id: objectIdSchema }).strict();

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number must be at least 7 characters.")
  .max(20, "Phone number must be at most 20 characters.")
  .regex(/^[+()\d\s-]+$/, "Phone number contains invalid characters.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(100, "Name must be at most 100 characters.");

const specializationSchema = z
  .string()
  .trim()
  .min(2, "Specialization must be at least 2 characters.")
  .max(100, "Specialization must be at most 100 characters.");

const hospitalSchema = z
  .string()
  .trim()
  .min(2, "Hospital must be at least 2 characters.")
  .max(150, "Hospital must be at most 150 characters.");

const conditionSchema = z
  .string()
  .trim()
  .min(2, "Condition must be at least 2 characters.")
  .max(150, "Condition must be at most 150 characters.");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email must be at most 254 characters.")
  .email("Enter a valid email address, e.g. name@example.com.");

const optionalEmailSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  emailSchema.optional(),
);

const profilePictureDataUrlSchema = z
  .string()
  .trim()
  .min(1, "Upload your profile picture.")
  .max(1_200_000, "The profile picture is too large.")
  .regex(
    /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
    "Upload a JPEG, PNG, or WebP profile picture.",
  );

const searchSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(100, "Search must be at most 100 characters.").optional(),
);

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.")
  .refine(
    (value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()),
    "Enter a valid date.",
  );

const listBaseShape = {
  page: z.coerce.number().int().min(1, "Page must be at least 1.").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit must be at most 100.")
    .default(20),
  search: searchSchema,
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  sort: z.enum(["createdAt", "name"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
};

const ageSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce
    .number({ error: "Age is required." })
    .int("Age must be a whole number.")
    .min(0, "Age cannot be negative.")
    .max(130, "Age must be at most 130."),
);

function ensureDateOrder(value) {
  return !(value.from && value.to && value.from > value.to);
}

const dateOrderIssue = {
  path: ["from"],
  message: "The start date must be before the end date.",
};

export const doctorCreateSchema = z
  .object({
    name: nameSchema,
    specialization: specializationSchema,
    hospital: hospitalSchema,
    phone: phoneSchema,
    email: emailSchema,
  })
  .strict();

export const doctorUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    specialization: specializationSchema.optional(),
    hospital: hospitalSchema.optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const doctorSelfUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    specialization: specializationSchema.optional(),
    hospital: hospitalSchema.optional(),
    phone: phoneSchema.optional(),
    profilePicture: profilePictureDataUrlSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const doctorListQuerySchema = z
  .object({
    ...listBaseShape,
    specialization: specializationSchema.optional(),
    hospital: hospitalSchema.optional(),
  })
  .strict()
  .refine(ensureDateOrder, dateOrderIssue);

export const doctorOptionsQuerySchema = z
  .object({
    search: searchSchema,
    limit: z.coerce.number().int().min(1).max(50).default(50),
  })
  .strict();

export const patientCreateSchema = z
  .object({
    name: nameSchema,
    age: ageSchema,
    gender: z.enum(GENDERS, { error: "Select a valid sex." }),
    condition: conditionSchema,
    phone: phoneSchema,
    email: optionalEmailSchema,
    doctorId: objectIdSchema,
  })
  .strict();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

export const publicDoctorRegistrationSchema = z
  .object({
    name: nameSchema,
    specialization: specializationSchema,
    hospital: hospitalSchema,
    phone: phoneSchema,
    email: emailSchema,
    profilePicture: profilePictureDataUrlSchema,
    password: passwordSchema,
  })
  .strict();

export const publicPatientRegistrationSchema = z
  .object({
    name: nameSchema,
    age: ageSchema,
    gender: z.enum(GENDERS, { error: "Select a valid sex." }),
    condition: conditionSchema,
    phone: phoneSchema,
    email: emailSchema,
    doctorId: objectIdSchema,
    password: passwordSchema,
  })
  .strict();

function withPasswordConfirmation(schema) {
  return schema
    .extend({
      confirmPassword: z.string().min(1, "Confirm your password.").max(128),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
}

export const publicDoctorRegistrationFormSchema = withPasswordConfirmation(
  publicDoctorRegistrationSchema,
);

export const publicPatientRegistrationFormSchema = withPasswordConfirmation(
  publicPatientRegistrationSchema,
);

export const patientUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    age: ageSchema.optional(),
    gender: z.enum(GENDERS, { error: "Select a valid sex." }).optional(),
    condition: conditionSchema.optional(),
    phone: phoneSchema.optional(),
    email: optionalEmailSchema,
    doctorId: objectIdSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const patientSelfUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    age: ageSchema.optional(),
    gender: z.enum(GENDERS, { error: "Select a valid sex." }).optional(),
    condition: conditionSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const patientDoctorUpdateSchema = z
  .object({
    doctorId: objectIdSchema,
  })
  .strict();

export const patientTreatmentSchema = z
  .object({
    outcome: z.enum(["treated", "rejected"]),
  })
  .strict();

export const patientHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, "Page must be at least 1.").default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1.")
      .max(100, "Limit must be at most 100.")
      .default(20),
    search: searchSchema,
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    sort: z.enum(["createdAt", "name"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .refine(ensureDateOrder, dateOrderIssue);

export const patientListQuerySchema = z
  .object({
    ...listBaseShape,
    condition: conditionSchema.optional(),
    doctorId: objectIdSchema.optional(),
  })
  .strict()
  .refine(ensureDateOrder, dateOrderIssue);

export const registrationRequestListQuerySchema = z
  .object({
    type: z.enum(["doctor", "patient"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const dashboardRangeSchema = z.enum(["7d", "30d", "90d", "12m"]);

export const dashboardRangeQuerySchema = z
  .object({
    range: dashboardRangeSchema.default("30d"),
  })
  .strict();

export const signInSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required.").max(128),
  })
  .strict();

export const RANGE_LABELS = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

export { z };
