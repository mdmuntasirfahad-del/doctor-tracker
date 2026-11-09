// Doctor Tracker API — a deliberately single-file Express backend.
// HTTP handling, MongoDB access, validation wiring, seeding and startup
// all live here. Shared Zod schemas and the Better Auth config remain in
// packages/ because the Next.js client imports the same code.

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import { auth, authEnv, closeAuthConnection, getDb, mongoClient } from "@doctor-tracker/auth";
import {
  dashboardRangeQuerySchema,
  doctorCreateSchema,
  doctorListQuerySchema,
  doctorOptionsQuerySchema,
  doctorSelfUpdateSchema,
  doctorUpdateSchema,
  idParamsSchema,
  patientCreateSchema,
  patientDoctorUpdateSchema,
  patientHistoryQuerySchema,
  patientListQuerySchema,
  patientSelfUpdateSchema,
  patientTreatmentSchema,
  patientUpdateSchema,
  publicDoctorRegistrationSchema,
  publicPatientRegistrationSchema,
  registrationRequestListQuerySchema,
} from "@doctor-tracker/validation";

/* ------------------------------------------------------------------ */
/* Environment                                                        */
/* ------------------------------------------------------------------ */

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  MONGODB_DB: z.string().min(1).default("doctor_tracker"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://127.0.0.1:3000"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL."),
  IMGBB_API_KEY: z.string().trim().min(1, "IMGBB_API_KEY is required."),
  SEED_ADMIN_NAME: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment:\n${details}`);
}

const env = parsedEnv.data;
const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Authentication required.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Administrator access required.") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "The requested resource was not found.", details) {
    return new ApiError(404, "NOT_FOUND", message, details);
  }

  static conflict(message, details) {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static serviceUnavailable(message) {
    return new ApiError(503, "SERVICE_UNAVAILABLE", message);
  }
}

function sendSuccess(res, data, meta, status = 200) {
  const body = { success: true, data };
  if (meta !== undefined) {
    body.meta = meta;
  }
  return res.status(status).json(body);
}

function sendNoContent(res) {
  return res.status(204).end();
}

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return res.status(status).json({ success: false, error });
}

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function formatIssues(error) {
  const flattened = error.flatten();
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened.fieldErrors).filter(([, messages]) => messages?.length),
  );
  return {
    fieldErrors,
    formErrors: flattened.formErrors,
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

function validate(schemas) {
  return function validationMiddleware(req, res, next) {
    const validated = {};

    for (const key of ["params", "query", "body"]) {
      const schema = schemas[key];
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(
          ApiError.badRequest(
            "Please check the submitted values and try again.",
            formatIssues(result.error),
          ),
        );
      }
      validated[key] = result.data;
    }

    req.validated = validated;
    return next();
  };
}

function requireJson(req, res, next) {
  if (!req.is("application/json")) {
    return next(ApiError.badRequest("Requests with a body must use application/json."));
  }
  return next();
}

function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

function paginationSkip(page, limit) {
  return (page - 1) * limit;
}

function displayReference(prefix, id) {
  return `${prefix}-${String(id).slice(-4).toUpperCase()}`;
}

function buildDateFilter(from, to) {
  if (!from && !to) {
    return undefined;
  }

  const filter = {};
  if (from) {
    filter.$gte = new Date(`${from}T00:00:00.000Z`);
  }
  if (to) {
    filter.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  return filter;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ------------------------------------------------------------------ */
/* Profile pictures (ImgBB)                                           */
/* ------------------------------------------------------------------ */

const MAX_PROFILE_PICTURE_BYTES = 1024 * 1024;

const PROFILE_PICTURE_FORMATS = {
  "image/jpeg": { extension: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
};

function invalidProfilePicture(message) {
  return new ApiError(400, "VALIDATION_ERROR", message, {
    fieldErrors: { profilePicture: [message] },
  });
}

function parseProfilePicture(dataUrl) {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) {
    throw invalidProfilePicture("Upload a JPEG, PNG, or WebP profile picture.");
  }

  const mime = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const buffer = Buffer.from(match[2], "base64");

  if (buffer.length === 0 || buffer.length > MAX_PROFILE_PICTURE_BYTES) {
    throw invalidProfilePicture("The profile picture must be 1 MB or smaller.");
  }

  const format = PROFILE_PICTURE_FORMATS[mime];
  const isWebp =
    mime === "image/webp" &&
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  const hasMagicBytes = format?.magic.every((byte, index) => buffer[index] === byte) ?? false;

  if (!isWebp && !hasMagicBytes) {
    throw invalidProfilePicture("Upload a valid JPEG, PNG, or WebP profile picture.");
  }

  return {
    buffer,
    mime,
    extension: format?.extension ?? "webp",
  };
}

async function uploadProfilePictureToImgbb(dataUrl) {
  const { buffer, mime, extension } = parseProfilePicture(dataUrl);
  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mime }), `doctor-profile.${extension}`);

  let response;
  try {
    response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`,
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(20000),
      },
    );
  } catch {
    throw new ApiError(
      502,
      "PROFILE_PICTURE_UPLOAD_FAILED",
      "The profile picture could not be uploaded. Please try again.",
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true || !payload?.data?.url) {
    console.error(
      `[imgbb] Profile picture upload failed (${response.status}): ${
        payload?.error?.message ?? "unknown error"
      }`,
    );
    throw new ApiError(
      502,
      "PROFILE_PICTURE_UPLOAD_FAILED",
      "The profile picture could not be uploaded. Please try again.",
    );
  }

  return {
    url: payload.data.url,
    thumbUrl: payload.data.thumb?.url ?? payload.data.url,
    mediumUrl: payload.data.medium?.url ?? payload.data.url,
  };
}

function serializeDoctor(document, patientCount = 0) {
  return {
    id: document._id.toString(),
    reference: displayReference("D", document._id),
    name: document.name,
    specialization: document.specialization,
    hospital: document.hospital,
    phone: document.phone,
    email: document.email,
    profilePicture: document.profilePicture ?? null,
    patientCount,
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
  };
}

function serializeDoctorOption(document) {
  return {
    id: document._id.toString(),
    name: document.name,
    specialization: document.specialization,
    hospital: document.hospital,
  };
}

function serializePatient(document) {
  const doctor = document.doctor
    ? {
        id: document.doctor.id?.toString?.() ?? document.doctor._id?.toString?.(),
        name: document.doctor.name,
        specialization: document.doctor.specialization,
        ...(document.doctor.hospital !== undefined ? { hospital: document.doctor.hospital } : {}),
        ...(document.doctor.phone !== undefined ? { phone: document.doctor.phone } : {}),
        ...(document.doctor.email !== undefined ? { email: document.doctor.email } : {}),
        profilePicture: document.doctor.profilePicture ?? null,
      }
    : null;

  return {
    id: document._id.toString(),
    reference: displayReference("PT", document._id),
    name: document.name,
    age: document.age,
    gender: document.gender,
    condition: document.condition,
    phone: document.phone,
    email: document.email ?? null,
    doctorId: document.doctorId?.toString?.() ?? null,
    doctor,
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
  };
}

function serializePatientHistoryEntry(document) {
  return {
    id: document._id.toString(),
    outcome: document.outcome,
    endedAt: toIso(document.endedAt),
    patient: {
      id: document.patientId.toString(),
      reference: document.patient.reference,
      name: document.patient.name,
      age: document.patient.age,
      gender: document.patient.gender,
      condition: document.patient.condition,
      phone: document.patient.phone,
      email: document.patient.email ?? null,
    },
    doctor: {
      id: document.doctorId.toString(),
      name: document.doctor.name,
      specialization: document.doctor.specialization,
      hospital: document.doctor.hospital,
      phone: document.doctor.phone,
      email: document.doctor.email ?? null,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Database and indexes                                               */
/* ------------------------------------------------------------------ */

function doctorsCollection() {
  return getDb().collection("doctors");
}

function patientsCollection() {
  return getDb().collection("patients");
}

function registrationRequestsCollection() {
  return getDb().collection("registration_requests");
}

function patientHistoryCollection() {
  return getDb().collection("patient_history");
}

async function ensureIndexes() {
  const doctors = doctorsCollection();
  const patients = patientsCollection();
  const registrations = registrationRequestsCollection();
  const patientHistory = patientHistoryCollection();

  await Promise.all([
    doctors.createIndexes([
      { key: { email: 1 }, name: "uniq_doctor_email", unique: true },
      {
        key: { registrationRequestId: 1 },
        name: "uniq_doctor_registration_request",
        unique: true,
        sparse: true,
      },
      { key: { userId: 1 }, name: "uniq_doctor_user", unique: true, sparse: true },
      { key: { createdAt: -1 }, name: "doctors_created_at" },
      {
        key: { specialization: 1, createdAt: -1 },
        name: "doctors_specialization_created_at",
      },
      { key: { hospital: 1, createdAt: -1 }, name: "doctors_hospital_created_at" },
      {
        key: { name: "text", specialization: "text", hospital: "text", email: "text" },
        name: "doctors_search",
      },
    ]),
    patients.createIndexes([
      { key: { doctorId: 1, createdAt: -1 }, name: "patients_doctor_created_at" },
      {
        key: { registrationRequestId: 1 },
        name: "uniq_patient_registration_request",
        unique: true,
        sparse: true,
      },
      { key: { userId: 1 }, name: "uniq_patient_user", unique: true, sparse: true },
      { key: { condition: 1, createdAt: -1 }, name: "patients_condition_created_at" },
      { key: { createdAt: -1 }, name: "patients_created_at" },
      { key: { name: "text", condition: "text" }, name: "patients_search" },
    ]),
    registrations.createIndexes([
      {
        key: { type: 1, status: 1, createdAt: -1 },
        name: "registrations_type_status_created_at",
      },
      { key: { doctorId: 1 }, name: "registrations_doctor_id" },
      {
        key: { email: 1 },
        name: "registrations_pending_doctor_email",
        unique: true,
        partialFilterExpression: { type: "doctor", status: "pending" },
      },
    ]),
    patientHistory.createIndexes([
      { key: { patientId: 1, endedAt: -1 }, name: "patient_history_patient_ended_at" },
      {
        key: { doctorId: 1, outcome: 1, endedAt: -1 },
        name: "patient_history_doctor_outcome_ended_at",
      },
    ]),
  ]);
}

/* ------------------------------------------------------------------ */
/* Doctors                                                            */
/* ------------------------------------------------------------------ */

const DOCTOR_PUBLIC_PROJECTION = {
  name: 1,
  specialization: 1,
  hospital: 1,
  phone: 1,
  email: 1,
  profilePicture: 1,
  createdAt: 1,
  updatedAt: 1,
};

function buildDoctorFilter(query) {
  const filter = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.specialization) {
    filter.specialization = query.specialization;
  }
  if (query.hospital) {
    filter.hospital = query.hospital;
  }

  const dateFilter = buildDateFilter(query.from, query.to);
  if (dateFilter) {
    filter.createdAt = dateFilter;
  }

  return filter;
}

function buildDoctorSort(query) {
  const direction = query.order === "asc" ? 1 : -1;
  const field = query.sort === "name" ? "name" : "createdAt";
  return { [field]: direction, _id: direction };
}

async function distinctDoctorValues(field) {
  const values = await doctorsCollection().distinct(field);
  return values.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

async function listDoctors(query) {
  const filter = buildDoctorFilter(query);
  const sort = buildDoctorSort(query);
  const skip = paginationSkip(query.page, query.limit);

  const [facetResult, specializations, hospitals] = await Promise.all([
    doctorsCollection()
      .aggregate([
        { $match: filter },
        { $sort: sort },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: query.limit },
              {
                $lookup: {
                  from: "patients",
                  let: { doctorId: "$_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$doctorId", "$$doctorId"] } } },
                    { $count: "count" },
                  ],
                  as: "patientStats",
                },
              },
              {
                $addFields: {
                  patientCount: {
                    $ifNull: [{ $arrayElemAt: ["$patientStats.count", 0] }, 0],
                  },
                },
              },
              { $project: { ...DOCTOR_PUBLIC_PROJECTION, patientCount: 1 } },
            ],
            total: [{ $count: "count" }],
          },
        },
      ])
      .toArray(),
    distinctDoctorValues("specialization"),
    distinctDoctorValues("hospital"),
  ]);

  const result = facetResult[0] ?? { data: [], total: [] };
  const total = result.total[0]?.count ?? 0;

  return {
    doctors: result.data.map((doctor) => serializeDoctor(doctor, doctor.patientCount ?? 0)),
    meta: {
      ...buildPaginationMeta({ page: query.page, limit: query.limit, total }),
      specializations,
      hospitals,
    },
  };
}

async function listDoctorOptions(query) {
  const filter = {};
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const doctors = await doctorsCollection()
    .find(filter, { projection: DOCTOR_PUBLIC_PROJECTION })
    .sort({ name: 1, _id: 1 })
    .limit(query.limit)
    .toArray();

  return doctors.map(serializeDoctorOption);
}

async function getDoctorById(id) {
  const _id = new ObjectId(id);
  const [doctor, patientCount] = await Promise.all([
    doctorsCollection().findOne({ _id }, { projection: DOCTOR_PUBLIC_PROJECTION }),
    patientsCollection().countDocuments({ doctorId: _id }),
  ]);

  if (!doctor) {
    throw ApiError.notFound("Doctor not found.");
  }

  return serializeDoctor(doctor, patientCount);
}

async function createDoctor(input) {
  const now = new Date();
  const document = {
    name: input.name,
    specialization: input.specialization,
    hospital: input.hospital,
    phone: input.phone,
    email: input.email,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await doctorsCollection().insertOne(document);
    return serializeDoctor({ ...document, _id: result.insertedId }, 0);
  } catch (error) {
    if (error?.code === 11000) {
      throw ApiError.conflict("A doctor with this email already exists.", {
        fieldErrors: { email: ["A doctor with this email already exists."] },
      });
    }
    throw error;
  }
}

async function updateDoctor(id, input) {
  const _id = new ObjectId(id);
  const update = { ...input, updatedAt: new Date() };

  let doctor;
  try {
    doctor = await doctorsCollection().findOneAndUpdate(
      { _id },
      { $set: update },
      { returnDocument: "after", projection: DOCTOR_PUBLIC_PROJECTION },
    );
  } catch (error) {
    if (error?.code === 11000) {
      throw ApiError.conflict("A doctor with this email already exists.", {
        fieldErrors: { email: ["A doctor with this email already exists."] },
      });
    }
    throw error;
  }

  if (!doctor) {
    throw ApiError.notFound("Doctor not found.");
  }

  const patientCount = await patientsCollection().countDocuments({ doctorId: _id });

  return serializeDoctor(doctor, patientCount);
}

/* ------------------------------------------------------------------ */
/* Patients                                                           */
/* ------------------------------------------------------------------ */

const PATIENT_PUBLIC_PROJECTION = {
  name: 1,
  age: 1,
  gender: 1,
  condition: 1,
  phone: 1,
  email: 1,
  doctorId: 1,
  createdAt: 1,
  updatedAt: 1,
};

const PATIENT_DOCTOR_LOOKUP = {
  $lookup: {
    from: "doctors",
    localField: "doctorId",
    foreignField: "_id",
    pipeline: [{ $project: { name: 1, specialization: 1, profilePicture: 1 } }],
    as: "doctor",
  },
};

const PATIENT_DOCTOR_UNWIND = {
  $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true },
};

const PATIENT_DOCTOR_PROJECTION = {
  ...PATIENT_PUBLIC_PROJECTION,
  doctor: {
    $cond: [
      { $ifNull: ["$doctor._id", null] },
      {
        id: "$doctor._id",
        name: "$doctor.name",
        specialization: "$doctor.specialization",
        profilePicture: "$doctor.profilePicture",
      },
      null,
    ],
  },
};

// The patient portal may show the signed-in patient the full profile of the
// doctor they are assigned to. This lookup is used only by that portal route so
// directory and doctor-facing patient lists keep their compact doctor summary.
const PORTAL_PATIENT_DOCTOR_LOOKUP = {
  $lookup: {
    from: "doctors",
    localField: "doctorId",
    foreignField: "_id",
    pipeline: [
      {
        $project: {
          name: 1,
          specialization: 1,
          hospital: 1,
          phone: 1,
          email: 1,
          profilePicture: 1,
        },
      },
    ],
    as: "doctor",
  },
};

const PORTAL_PATIENT_DOCTOR_PROJECTION = {
  ...PATIENT_PUBLIC_PROJECTION,
  doctor: {
    $cond: [
      { $ifNull: ["$doctor._id", null] },
      {
        id: "$doctor._id",
        name: "$doctor.name",
        specialization: "$doctor.specialization",
        hospital: "$doctor.hospital",
        phone: "$doctor.phone",
        email: "$doctor.email",
        profilePicture: "$doctor.profilePicture",
      },
      null,
    ],
  },
};

function buildPatientFilter(query) {
  const filter = {};

  if (query.search) {
    const referenceMatch = query.search.match(/^(?:PT-)?([a-f\d]{4})$/i);
    if (referenceMatch) {
      filter.$expr = {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: `${referenceMatch[1]}$`,
          options: "i",
        },
      };
    } else {
      filter.$text = { $search: query.search };
    }
  }
  if (query.condition) {
    filter.condition = query.condition;
  }
  if (query.doctorId) {
    filter.doctorId = new ObjectId(query.doctorId);
  }

  const dateFilter = buildDateFilter(query.from, query.to);
  if (dateFilter) {
    filter.createdAt = dateFilter;
  }

  return filter;
}

function buildPatientSort(query) {
  const direction = query.order === "asc" ? 1 : -1;
  const field = query.sort === "name" ? "name" : "createdAt";
  return { [field]: direction, _id: direction };
}

async function distinctConditions() {
  const values = await patientsCollection().distinct("condition");
  return values.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

async function listPatients(query) {
  const filter = buildPatientFilter(query);
  const sort = buildPatientSort(query);
  const skip = paginationSkip(query.page, query.limit);

  const [facetResult, conditions] = await Promise.all([
    patientsCollection()
      .aggregate([
        { $match: filter },
        { $sort: sort },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: query.limit },
              PATIENT_DOCTOR_LOOKUP,
              PATIENT_DOCTOR_UNWIND,
              { $project: PATIENT_DOCTOR_PROJECTION },
            ],
            total: [{ $count: "count" }],
          },
        },
      ])
      .toArray(),
    distinctConditions(),
  ]);

  const result = facetResult[0] ?? { data: [], total: [] };
  const total = result.total[0]?.count ?? 0;

  return {
    patients: result.data.map(serializePatient),
    meta: {
      ...buildPaginationMeta({ page: query.page, limit: query.limit, total }),
      conditions,
    },
  };
}

async function getPatientById(id) {
  const result = await patientsCollection()
    .aggregate([
      { $match: { _id: new ObjectId(id) } },
      PATIENT_DOCTOR_LOOKUP,
      PATIENT_DOCTOR_UNWIND,
      { $project: PATIENT_DOCTOR_PROJECTION },
      { $limit: 1 },
    ])
    .toArray();

  if (!result[0]) {
    throw ApiError.notFound("Patient not found.");
  }

  return serializePatient(result[0]);
}

async function createPatient(input) {
  const now = new Date();
  const doctorId = new ObjectId(input.doctorId);
  const session = mongoClient.startSession();
  let patientId;
  try {
    await session.withTransaction(async () => {
      const doctor = await doctorsCollection().findOneAndUpdate(
        { _id: doctorId },
        { $inc: { patientMutationVersion: 1 } },
        { returnDocument: "after", projection: { _id: 1 }, session },
      );
      if (!doctor) {
        throw ApiError.notFound("Doctor not found.", { code: "DOCTOR_NOT_FOUND" });
      }
      const result = await patientsCollection().insertOne(
        {
          name: input.name,
          age: input.age,
          gender: input.gender,
          condition: input.condition,
          phone: input.phone,
          ...(input.email ? { email: input.email } : {}),
          doctorId,
          createdAt: now,
          updatedAt: now,
        },
        { session },
      );
      patientId = result.insertedId;
    });
  } finally {
    await session.endSession();
  }
  return getPatientById(patientId.toString());
}

async function updatePatient(id, input) {
  const _id = new ObjectId(id);
  const session = mongoClient.startSession();
  try {
    await session.withTransaction(async () => {
      const update = { updatedAt: new Date() };
      for (const [key, value] of Object.entries(input)) {
        if (value === undefined || key === "doctorId") {
          continue;
        }
        update[key] = value;
      }

      if (input.doctorId) {
        const doctorId = new ObjectId(input.doctorId);
        const doctor = await doctorsCollection().updateOne(
          { _id: doctorId },
          { $inc: { patientMutationVersion: 1 } },
          { session },
        );
        if (doctor.matchedCount !== 1) {
          throw ApiError.notFound("Doctor not found.", { code: "DOCTOR_NOT_FOUND" });
        }
        update.doctorId = doctorId;
      }

      const result = await patientsCollection().updateOne({ _id }, { $set: update }, { session });
      if (result.matchedCount !== 1) {
        throw ApiError.notFound("Patient not found.");
      }
    });
  } finally {
    await session.endSession();
  }
  return getPatientById(id);
}

async function deletePatient(id) {
  const session = mongoClient.startSession();
  let removedUserId = null;
  try {
    await session.withTransaction(async () => {
      const patient = await patientsCollection().findOneAndDelete(
        { _id: new ObjectId(id) },
        { session },
      );
      if (!patient) {
        throw ApiError.notFound("Patient not found.");
      }
      removedUserId = patient.userId ?? null;
      await patientHistoryCollection().deleteMany({ patientId: patient._id }, { session });
      if (patient.registrationRequestId) {
        await registrationRequestsCollection().deleteOne(
          { _id: patient.registrationRequestId, status: "approved", approvedRecordId: patient._id },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }
  return { userId: removedUserId };
}

async function deleteDoctor(id) {
  const doctorId = new ObjectId(id);
  const session = mongoClient.startSession();
  let removedUserId = null;
  try {
    await session.withTransaction(async () => {
      const doctor = await doctorsCollection().findOneAndUpdate(
        { _id: doctorId },
        { $inc: { patientMutationVersion: 1 } },
        { returnDocument: "after", session },
      );
      if (!doctor) {
        throw ApiError.notFound("Doctor not found.");
      }
      removedUserId = doctor.userId ?? null;
      if (await patientsCollection().countDocuments({ doctorId }, { session })) {
        throw ApiError.conflict(
          "Reassign or delete this doctor's patients before deleting the doctor.",
        );
      }
      if (
        await registrationRequestsCollection().countDocuments(
          { type: "patient", status: "pending", doctorId },
          { session },
        )
      ) {
        throw ApiError.conflict(
          "Resolve pending patient registration requests for this doctor before deleting the doctor.",
        );
      }
      await doctorsCollection().deleteOne({ _id: doctorId }, { session });
      if (doctor.registrationRequestId) {
        await registrationRequestsCollection().deleteOne(
          { _id: doctor.registrationRequestId, status: "approved", approvedRecordId: doctorId },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }
  return { userId: removedUserId };
}

/* ------------------------------------------------------------------ */
/* Portal read models                                                 */
/* ------------------------------------------------------------------ */

async function getDoctorByUserId(userId) {
  const doctor = await doctorsCollection().findOne(
    { userId },
    { projection: DOCTOR_PUBLIC_PROJECTION },
  );
  if (!doctor) {
    throw ApiError.notFound("No doctor profile is linked to this account.");
  }
  const patientCount = await patientsCollection().countDocuments({ doctorId: doctor._id });
  return serializeDoctor(doctor, patientCount);
}

async function updateDoctorByUserId(userId, input) {
  const existing = await doctorsCollection().findOne({ userId }, { projection: { _id: 1 } });

  if (!existing) {
    throw ApiError.notFound("No doctor profile is linked to this account.");
  }

  const { profilePicture, ...fields } = input;
  const update = { ...fields, updatedAt: new Date() };
  if (profilePicture) {
    update.profilePicture = await uploadProfilePictureToImgbb(profilePicture);
  }

  const doctor = await doctorsCollection().findOneAndUpdate(
    { userId },
    { $set: update },
    { returnDocument: "after", projection: DOCTOR_PUBLIC_PROJECTION },
  );

  if (!doctor) {
    throw ApiError.notFound("No doctor profile is linked to this account.");
  }

  const patientCount = await patientsCollection().countDocuments({ doctorId: doctor._id });
  return serializeDoctor(doctor, patientCount);
}

async function listDoctorPatientsForUser(userId, query) {
  const doctor = await doctorsCollection().findOne({ userId }, { projection: { _id: 1 } });
  if (!doctor) {
    throw ApiError.notFound("No doctor profile is linked to this account.");
  }
  return listPatients({ ...query, doctorId: doctor._id.toString() });
}

async function getPatientByUserId(userId) {
  const result = await patientsCollection()
    .aggregate([
      { $match: { userId } },
      PORTAL_PATIENT_DOCTOR_LOOKUP,
      PATIENT_DOCTOR_UNWIND,
      { $project: PORTAL_PATIENT_DOCTOR_PROJECTION },
      { $limit: 1 },
    ])
    .toArray();

  if (!result[0]) {
    throw ApiError.notFound("No patient record is linked to this account.");
  }

  return serializePatient(result[0]);
}

async function updatePatientByUserId(userId, input) {
  const patient = await patientsCollection().findOneAndUpdate(
    { userId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after", projection: { _id: 1 } },
  );

  if (!patient) {
    throw ApiError.notFound("No patient record is linked to this account.");
  }

  return getPatientByUserId(userId);
}

async function changePatientDoctorByUserId(userId, doctorId) {
  const session = mongoClient.startSession();
  const nextDoctorId = new ObjectId(doctorId);
  try {
    await session.withTransaction(async () => {
      const patient = await patientsCollection().findOne(
        { userId },
        { projection: { _id: 1, doctorId: 1 }, session },
      );
      if (!patient) {
        throw ApiError.notFound("No patient record is linked to this account.");
      }
      if (patient.doctorId?.equals?.(nextDoctorId)) {
        return;
      }

      const doctor = await doctorsCollection().updateOne(
        { _id: nextDoctorId },
        { $inc: { patientMutationVersion: 1 } },
        { session },
      );
      if (doctor.matchedCount !== 1) {
        throw ApiError.notFound("Doctor not found.", { code: "DOCTOR_NOT_FOUND" });
      }

      await patientsCollection().updateOne(
        { _id: patient._id },
        { $set: { doctorId: nextDoctorId, updatedAt: new Date() } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  return getPatientByUserId(userId);
}

function buildHistoryFilter(query, searchFields) {
  const filter = {};

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = searchFields.map((field) => ({ [field]: pattern }));
  }

  const dateFilter = buildDateFilter(query.from, query.to);
  if (dateFilter) {
    filter.endedAt = dateFilter;
  }

  return filter;
}

async function listHistoryEntries({ filter, query, nameField }) {
  const direction = query.order === "asc" ? 1 : -1;
  const sort = { [query.sort === "name" ? nameField : "endedAt"]: direction, _id: direction };
  const skip = paginationSkip(query.page, query.limit);

  const [facetResult] = await patientHistoryCollection()
    .aggregate([
      { $match: filter },
      { $sort: sort },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: query.limit }],
          total: [{ $count: "count" }],
        },
      },
    ])
    .toArray();

  const result = facetResult ?? { data: [], total: [] };
  const total = result.total[0]?.count ?? 0;

  return {
    entries: result.data.map(serializePatientHistoryEntry),
    meta: buildPaginationMeta({ page: query.page, limit: query.limit, total }),
  };
}

async function listDoctorHistoryForUser(userId, query) {
  const doctor = await doctorsCollection().findOne({ userId }, { projection: { _id: 1 } });
  if (!doctor) {
    throw ApiError.notFound("No doctor profile is linked to this account.");
  }

  return listHistoryEntries({
    filter: {
      ...buildHistoryFilter(query, ["patient.name", "patient.reference"]),
      doctorId: doctor._id,
      outcome: "treated",
    },
    query,
    nameField: "patient.name",
  });
}

async function listPatientHistoryForUser(userId, query) {
  const patient = await patientsCollection().findOne({ userId }, { projection: { _id: 1 } });
  if (!patient) {
    throw ApiError.notFound("No patient record is linked to this account.");
  }

  return listHistoryEntries({
    filter: {
      ...buildHistoryFilter(query, ["doctor.name", "doctor.specialization"]),
      patientId: patient._id,
    },
    query,
    nameField: "doctor.name",
  });
}

async function recordPatientOutcomeForUser(userId, patientId, outcome) {
  const session = mongoClient.startSession();
  let historyDocument = null;

  try {
    await session.withTransaction(async () => {
      const doctor = await doctorsCollection().findOne({ userId }, { session });
      if (!doctor) {
        throw ApiError.notFound("No doctor profile is linked to this account.");
      }

      const now = new Date();
      const patient = await patientsCollection().findOneAndUpdate(
        { _id: new ObjectId(patientId), doctorId: doctor._id },
        { $unset: { doctorId: "" }, $set: { updatedAt: now } },
        { returnDocument: "before", session },
      );

      if (!patient) {
        throw ApiError.notFound("This patient is not currently assigned to you.");
      }

      historyDocument = {
        patientId: patient._id,
        doctorId: doctor._id,
        patient: {
          reference: displayReference("PT", patient._id),
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          condition: patient.condition,
          phone: patient.phone,
          email: patient.email ?? null,
        },
        doctor: {
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          phone: doctor.phone,
          email: doctor.email ?? null,
        },
        outcome,
        endedAt: now,
      };

      const inserted = await patientHistoryCollection().insertOne(historyDocument, { session });
      historyDocument._id = inserted.insertedId;

      await doctorsCollection().updateOne(
        { _id: doctor._id },
        { $inc: { patientMutationVersion: 1 } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  return serializePatientHistoryEntry(historyDocument);
}

/* ------------------------------------------------------------------ */
/* Better Auth account helpers                                        */
/* ------------------------------------------------------------------ */

const PENDING_PASSWORD_ALGORITHM = "aes-256-gcm";
const pendingPasswordKey = Buffer.from(
  hkdfSync("sha256", env.BETTER_AUTH_SECRET, "doctor-tracker", "registration-password:v1", 32),
);

function pendingPasswordAad(type, email) {
  return Buffer.from(`${type}:${String(email).trim().toLowerCase()}`, "utf8");
}

function encryptPendingPassword(password, type, email) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(PENDING_PASSWORD_ALGORITHM, pendingPasswordKey, iv);
  cipher.setAAD(pendingPasswordAad(type, email));
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);

  return {
    algorithm: PENDING_PASSWORD_ALGORITHM,
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decryptPendingPassword(credential, type, email) {
  if (
    !credential ||
    credential.algorithm !== PENDING_PASSWORD_ALGORITHM ||
    credential.version !== 1
  ) {
    throw ApiError.conflict(
      "The password stored with this registration cannot be read. Ask the applicant to submit a new registration.",
    );
  }

  try {
    const decipher = createDecipheriv(
      PENDING_PASSWORD_ALGORITHM,
      pendingPasswordKey,
      Buffer.from(credential.iv, "base64"),
    );
    decipher.setAAD(pendingPasswordAad(type, email));
    decipher.setAuthTag(Buffer.from(credential.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(credential.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw ApiError.conflict(
      "The password stored with this registration cannot be read. Ask the applicant to submit a new registration.",
    );
  }
}

function isExistingAuthUserError(error) {
  const message = error?.body?.message ?? error?.message ?? "";
  return /user already exists/i.test(message);
}

async function removeAuthUserBestEffort(userId, headers) {
  if (!userId) {
    return;
  }

  try {
    await auth.api.removeUser({ body: { userId }, headers });
  } catch (error) {
    console.error(
      `[api] Could not remove Better Auth user ${userId} after a directory change: ${error?.name ?? "Error"}`,
    );
  }
}

async function syncAuthDisplayName(user, name, headers) {
  if (!user?.id || !name || user.name === name) {
    return;
  }

  try {
    await auth.api.updateUser({ body: { name }, headers });
  } catch (error) {
    console.error(
      `[api] Could not update the Better Auth display name for user ${user.id}: ${error?.name ?? "Error"}`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Public registration requests                                       */
/* ------------------------------------------------------------------ */

function registrationConflict(message) {
  return ApiError.conflict(message, {
    fieldErrors: { email: [message] },
  });
}

async function createDoctorRegistration(input) {
  const existingDoctor = await doctorsCollection().findOne(
    { email: input.email },
    { projection: { _id: 1 } },
  );

  if (existingDoctor) {
    throw registrationConflict("A doctor with this email already exists.");
  }

  const existingRequest = await registrationRequestsCollection().findOne(
    { type: "doctor", status: "pending", email: input.email },
    { projection: { _id: 1 } },
  );

  if (existingRequest) {
    throw registrationConflict("A doctor registration with this email is already awaiting review.");
  }

  const profilePicture = await uploadProfilePictureToImgbb(input.profilePicture);
  const now = new Date();
  const document = {
    type: "doctor",
    role: "doctor",
    status: "pending",
    name: input.name,
    specialization: input.specialization,
    hospital: input.hospital,
    phone: input.phone,
    email: input.email,
    profilePicture,
    passwordCredential: encryptPendingPassword(input.password, "doctor", input.email),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await registrationRequestsCollection().insertOne(document);
    return { id: result.insertedId.toString(), status: document.status };
  } catch (error) {
    if (error?.code === 11000) {
      throw registrationConflict(
        "A doctor registration with this email is already awaiting review.",
      );
    }
    throw error;
  }
}

async function createPatientRegistration(input) {
  const now = new Date();
  const doctorId = new ObjectId(input.doctorId);
  const session = mongoClient.startSession();
  let requestId;
  try {
    await session.withTransaction(async () => {
      const doctor = await doctorsCollection().findOneAndUpdate(
        { _id: doctorId },
        { $inc: { patientMutationVersion: 1 } },
        { returnDocument: "after", session },
      );
      if (!doctor) {
        throw ApiError.notFound("Doctor not found.", { code: "DOCTOR_NOT_FOUND" });
      }
      const document = {
        type: "patient",
        role: "patient",
        status: "pending",
        name: input.name,
        age: input.age,
        gender: input.gender,
        condition: input.condition,
        phone: input.phone,
        email: input.email,
        passwordCredential: encryptPendingPassword(input.password, "patient", input.email),
        doctorId,
        doctorSnapshot: {
          id: doctor._id.toString(),
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
        },
        createdAt: now,
        updatedAt: now,
      };
      const result = await registrationRequestsCollection().insertOne(document, { session });
      requestId = result.insertedId;
    });
  } finally {
    await session.endSession();
  }
  return { id: requestId.toString(), status: "pending" };
}

function serializeRegistrationRequest(request) {
  return {
    id: request._id.toString(),
    type: request.type,
    status: request.status,
    name: request.name,
    email: request.email ?? null,
    phone: request.phone,
    ...(request.type === "doctor"
      ? {
          specialization: request.specialization,
          hospital: request.hospital,
          profilePicture: request.profilePicture ?? null,
        }
      : {
          age: request.age,
          gender: request.gender,
          condition: request.condition,
          doctorId: request.doctorId?.toString?.() ?? null,
          doctor: request.doctorSnapshot ?? null,
        }),
    createdAt: toIso(request.createdAt),
  };
}

async function listRegistrationRequests(query) {
  const filter = { status: "pending" };
  if (query.type) {
    filter.type = query.type;
  }
  const [requests, total] = await Promise.all([
    registrationRequestsCollection()
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .skip(paginationSkip(query.page, query.limit))
      .toArray(),
    registrationRequestsCollection().countDocuments(filter),
  ]);
  return {
    requests: requests.map(serializeRegistrationRequest),
    meta: buildPaginationMeta({ page: query.page, limit: query.limit, total }),
  };
}

async function registrationRequestStateError(requestId) {
  const existing = await registrationRequestsCollection().findOne(
    { _id: requestId },
    { projection: { _id: 1 } },
  );
  if (!existing) {
    const approvedDoctor = await doctorsCollection().findOne(
      { registrationRequestId: requestId },
      { projection: { _id: 1 } },
    );
    const approvedPatient = approvedDoctor
      ? null
      : await patientsCollection().findOne(
          { registrationRequestId: requestId },
          { projection: { _id: 1 } },
        );
    if (approvedDoctor || approvedPatient) {
      return ApiError.conflict("This registration request has already been approved.");
    }
    return ApiError.notFound("Registration request not found.");
  }
  return ApiError.conflict("This registration request has already been processed.");
}

async function approveRegistrationRequest(id, headers) {
  const requestId = new ObjectId(id);
  const request = await registrationRequestsCollection().findOne({
    _id: requestId,
    status: "pending",
  });

  if (!request) {
    throw await registrationRequestStateError(requestId);
  }

  if (request.type !== "doctor" && request.type !== "patient") {
    throw ApiError.conflict("This registration request has an unsupported type.");
  }

  let createdUserId = null;
  if (request.passwordCredential) {
    if (!request.email) {
      throw ApiError.conflict(
        "This registration request has no email address and cannot be turned into an account.",
      );
    }

    const password = decryptPendingPassword(
      request.passwordCredential,
      request.type,
      request.email,
    );

    try {
      const created = await auth.api.createUser({
        body: {
          name: request.name,
          email: request.email,
          password,
          role: request.type,
        },
        headers,
      });
      createdUserId = created.user.id;
    } catch (error) {
      if (isExistingAuthUserError(error)) {
        throw registrationConflict("An account with this email already exists.");
      }
      throw error;
    }
  }

  const session = mongoClient.startSession();
  let createdRecordType;
  let createdRecordId;
  try {
    await session.withTransaction(async () => {
      const current = await registrationRequestsCollection().findOne(
        { _id: requestId, status: "pending" },
        { session },
      );
      if (!current) {
        throw ApiError.conflict("This registration request has already been processed.");
      }

      const now = new Date();
      let record;
      if (current.type === "doctor") {
        const document = {
          name: current.name,
          specialization: current.specialization,
          hospital: current.hospital,
          phone: current.phone,
          email: current.email,
          ...(current.profilePicture ? { profilePicture: current.profilePicture } : {}),
          ...(createdUserId ? { userId: createdUserId } : {}),
          registrationRequestId: current._id,
          createdAt: now,
          updatedAt: now,
        };
        const inserted = await doctorsCollection().insertOne(document, { session });
        record = { type: "doctor", id: inserted.insertedId };
      } else if (current.type === "patient") {
        const doctor = await doctorsCollection().findOneAndUpdate(
          { _id: current.doctorId },
          { $inc: { patientMutationVersion: 1 } },
          { returnDocument: "after", projection: { _id: 1 }, session },
        );
        if (!doctor) {
          throw ApiError.conflict(
            "The selected doctor no longer exists. This request cannot be approved.",
          );
        }
        const document = {
          name: current.name,
          age: current.age,
          gender: current.gender,
          condition: current.condition,
          phone: current.phone,
          ...(current.email ? { email: current.email } : {}),
          ...(createdUserId ? { userId: createdUserId } : {}),
          doctorId: current.doctorId,
          registrationRequestId: current._id,
          createdAt: now,
          updatedAt: now,
        };
        const inserted = await patientsCollection().insertOne(document, { session });
        record = { type: "patient", id: inserted.insertedId };
      } else {
        throw ApiError.conflict("This registration request has an unsupported type.");
      }

      const deleted = await registrationRequestsCollection().deleteOne(
        { _id: requestId, status: "pending" },
        { session },
      );
      if (deleted.deletedCount !== 1) {
        throw ApiError.conflict("This registration request has already been processed.");
      }
      createdRecordType = record.type;
      createdRecordId = record.id.toString();
    });
    return {
      id,
      status: "approved",
      recordType: createdRecordType,
      recordId: createdRecordId,
      requestDeleted: true,
      accountCreated: Boolean(createdUserId),
    };
  } catch (error) {
    await removeAuthUserBestEffort(createdUserId, headers);

    if (error?.code === 11000) {
      throw registrationConflict("A record with this email or request already exists.");
    }
    if (
      error?.code === 20 ||
      error?.code === 303 ||
      /transaction numbers are only allowed|replica set|mongos/i.test(error?.message ?? "")
    ) {
      throw ApiError.serviceUnavailable(
        "Approval requires MongoDB configured as a replica set or sharded cluster with transaction support.",
      );
    }
    if (!(error instanceof ApiError)) {
      console.error(
        `[api] Registration approval failed for request ${requestId.toString()}: ${error?.name ?? "Error"} (${error?.code ?? "no code"})`,
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function deletePendingRegistrationRequest(id) {
  const result = await registrationRequestsCollection().deleteOne({
    _id: new ObjectId(id),
    status: "pending",
  });
  if (result.deletedCount) {
    return;
  }
  const existing = await registrationRequestsCollection().findOne(
    { _id: new ObjectId(id) },
    { projection: { _id: 1 } },
  );
  if (!existing) {
    throw ApiError.notFound("Registration request not found.");
  }
  throw ApiError.conflict("Only pending registration requests can be deleted here.");
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

const monthShort = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const RANGE_LABELS = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

function addUtcDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function monthStartUtc(date, offsetMonths = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offsetMonths, 1));
}

function dayLabel(date) {
  return `${date.getUTCDate()} ${monthShort.format(date)}`;
}

function rangeLabel(start, endExclusive) {
  const endInclusive = new Date(endExclusive.getTime() - 1);
  if (start.getUTCMonth() === endInclusive.getUTCMonth()) {
    return `${start.getUTCDate()}–${endInclusive.getUTCDate()}`;
  }
  return `${dayLabel(start)}–${dayLabel(endInclusive)}`;
}

function buildDailyBuckets(start, count) {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addUtcDays(start, index);
    const bucketEnd = addUtcDays(start, index + 1);
    return {
      start: bucketStart,
      endExclusive: bucketEnd,
      label: dayLabel(bucketStart),
    };
  });
}

function buildWeeklyBuckets(start, count, endExclusive) {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addUtcDays(start, index * 7);
    const bucketEnd = index === count - 1 ? endExclusive : addUtcDays(start, (index + 1) * 7);
    return {
      start: bucketStart,
      endExclusive: bucketEnd,
      label: rangeLabel(bucketStart, bucketEnd),
    };
  });
}

function buildMonthlyBuckets(anchor, offsetStart, count) {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = monthStartUtc(anchor, offsetStart + index);
    const bucketEnd = monthStartUtc(anchor, offsetStart + index + 1);
    return {
      start: bucketStart,
      endExclusive: bucketEnd,
      label: monthYear.format(bucketStart),
    };
  });
}

function getRangeWindow(range, now = new Date()) {
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);

  if (range === "7d") {
    const currentStart = addUtcDays(todayStart, -6);
    const currentEndExclusive = addUtcDays(todayStart, 1);
    const previousStart = addUtcDays(currentStart, -7);
    const previousEndExclusive = currentStart;

    return {
      range,
      label: RANGE_LABELS[range],
      granularity: "day",
      summaryGranularity: "day",
      currentStart,
      currentEndInclusive: todayEnd,
      currentEndExclusive,
      previousStart,
      previousEndInclusive: new Date(currentStart.getTime() - 1),
      previousEndExclusive,
      currentBuckets: buildDailyBuckets(currentStart, 7),
      previousBuckets: buildDailyBuckets(previousStart, 7),
    };
  }

  if (range === "30d") {
    const currentStart = addUtcDays(todayStart, -29);
    const currentEndExclusive = addUtcDays(todayStart, 1);
    const previousStart = addUtcDays(currentStart, -30);
    const previousEndExclusive = currentStart;

    return {
      range,
      label: RANGE_LABELS[range],
      granularity: "week",
      currentStart,
      currentEndInclusive: todayEnd,
      currentEndExclusive,
      previousStart,
      previousEndInclusive: new Date(currentStart.getTime() - 1),
      previousEndExclusive,
      currentBuckets: buildWeeklyBuckets(currentStart, 5, currentEndExclusive),
      previousBuckets: buildWeeklyBuckets(previousStart, 5, previousEndExclusive),
    };
  }

  if (range === "90d") {
    const currentStart = addUtcDays(todayStart, -89);
    const currentEndExclusive = addUtcDays(todayStart, 1);
    const previousStart = addUtcDays(currentStart, -90);
    const previousEndExclusive = currentStart;

    return {
      range,
      label: RANGE_LABELS[range],
      granularity: "week",
      currentStart,
      currentEndInclusive: todayEnd,
      currentEndExclusive,
      previousStart,
      previousEndInclusive: new Date(currentStart.getTime() - 1),
      previousEndExclusive,
      currentBuckets: buildWeeklyBuckets(currentStart, 13, currentEndExclusive),
      previousBuckets: buildWeeklyBuckets(previousStart, 13, previousEndExclusive),
    };
  }

  const currentStart = monthStartUtc(now, -11);
  const currentEndExclusive = monthStartUtc(now, 1);
  const previousStart = monthStartUtc(now, -23);
  const previousEndExclusive = currentStart;

  return {
    range: "12m",
    label: RANGE_LABELS["12m"],
    granularity: "month",
    currentStart,
    currentEndInclusive: todayEnd,
    currentEndExclusive,
    previousStart,
    previousEndInclusive: new Date(currentStart.getTime() - 1),
    previousEndExclusive,
    currentBuckets: buildMonthlyBuckets(now, -11, 12),
    previousBuckets: buildMonthlyBuckets(now, -23, 12),
  };
}

function percentChange(current, previous) {
  if (!previous) {
    return null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

async function getDashboardSummary(range) {
  const window = getRangeWindow(range);

  const currentFilter = {
    createdAt: { $gte: window.currentStart, $lte: window.currentEndInclusive },
  };
  const previousFilter = {
    createdAt: { $gte: window.previousStart, $lte: window.previousEndInclusive },
  };

  const [
    totalDoctors,
    totalPatients,
    newDoctors,
    newPatients,
    previousNewDoctors,
    previousNewPatients,
  ] = await Promise.all([
    doctorsCollection().countDocuments(),
    patientsCollection().countDocuments(),
    doctorsCollection().countDocuments(currentFilter),
    patientsCollection().countDocuments(currentFilter),
    doctorsCollection().countDocuments(previousFilter),
    patientsCollection().countDocuments(previousFilter),
  ]);

  const average = totalDoctors ? Number((totalPatients / totalDoctors).toFixed(1)) : 0;

  return {
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      averagePatientsPerDoctor: average,
    },
    range: {
      key: window.range,
      label: window.label,
      granularity: window.summaryGranularity ?? window.granularity,
      startDate: window.currentStart.toISOString(),
      endDate: window.currentEndInclusive.toISOString(),
    },
    current: {
      newDoctors,
      newPatients,
    },
    previous: {
      newDoctors: previousNewDoctors,
      newPatients: previousNewPatients,
    },
    changes: {
      doctorsPercent: percentChange(newDoctors, previousNewDoctors),
      patientsPercent: percentChange(newPatients, previousNewPatients),
    },
  };
}

async function getPatientsPerDoctor() {
  const [items, totalDoctors, totalPatients] = await Promise.all([
    patientsCollection()
      .aggregate([
        { $match: { doctorId: { $ne: null } } },
        { $group: { _id: "$doctorId", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "doctors",
            localField: "_id",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, specialization: 1 } }],
            as: "doctor",
          },
        },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            doctorId: { $toString: "$_id" },
            name: { $ifNull: ["$doctor.name", "Unknown doctor"] },
            specialization: { $ifNull: ["$doctor.specialization", ""] },
            count: 1,
          },
        },
      ])
      .toArray(),
    doctorsCollection().countDocuments(),
    patientsCollection().countDocuments(),
  ]);

  return {
    items,
    meta: {
      totalDoctors,
      totalPatients,
      showing: items.length,
    },
  };
}

async function getPatientsOverTime(range) {
  const window = getRangeWindow(range);
  const allBuckets = [...window.previousBuckets, ...window.currentBuckets];
  const boundaries = [...allBuckets.map((bucket) => bucket.start), window.currentEndExclusive];

  const grouped = await patientsCollection()
    .aggregate([
      {
        $match: {
          createdAt: {
            $gte: window.previousStart,
            $lt: window.currentEndExclusive,
          },
        },
      },
      {
        $bucket: {
          groupBy: "$createdAt",
          boundaries,
          output: { count: { $sum: 1 } },
        },
      },
    ])
    .toArray();

  const currentMap = new Map(
    window.currentBuckets.map((bucket, index) => [bucket.start.getTime(), index]),
  );
  const previousMap = new Map(
    window.previousBuckets.map((bucket, index) => [bucket.start.getTime(), index]),
  );

  const buckets = window.currentBuckets.map((bucket, index) => ({
    label: bucket.label,
    current: 0,
    previous: 0,
    startDate: bucket.start.toISOString(),
    endDate: new Date(bucket.endExclusive.getTime() - 1).toISOString(),
    index,
  }));

  for (const row of grouped) {
    const timestamp = new Date(row._id).getTime();
    const currentIndex = currentMap.get(timestamp);
    if (currentIndex !== undefined) {
      buckets[currentIndex].current = row.count;
      continue;
    }
    const previousIndex = previousMap.get(timestamp);
    if (previousIndex !== undefined) {
      buckets[previousIndex].previous = row.count;
    }
  }

  const currentTotal = buckets.reduce((sum, bucket) => sum + bucket.current, 0);
  const previousTotal = buckets.reduce((sum, bucket) => sum + bucket.previous, 0);

  return {
    range: {
      key: window.range,
      label: window.label,
      granularity: window.granularity,
      startDate: window.currentStart.toISOString(),
      endDate: window.currentEndInclusive.toISOString(),
    },
    currentTotal,
    previousTotal,
    changePercent: percentChange(currentTotal, previousTotal),
    buckets,
  };
}

async function getDoctorDashboardForUser(userId, range) {
  const doctor = await doctorsCollection().findOne(
    { userId },
    { projection: DOCTOR_PUBLIC_PROJECTION },
  );
  if (!doctor) {
    throw ApiError.notFound("No doctor profile is linked to this account.");
  }

  const window = getRangeWindow(range);
  const doctorFilter = { doctorId: doctor._id };
  const currentPatientFilter = {
    ...doctorFilter,
    createdAt: { $gte: window.currentStart, $lte: window.currentEndInclusive },
  };
  const previousPatientFilter = {
    ...doctorFilter,
    createdAt: { $gte: window.previousStart, $lte: window.previousEndInclusive },
  };
  const historyFilter = {
    doctorId: doctor._id,
    endedAt: { $gte: window.currentStart, $lte: window.currentEndInclusive },
  };
  const previousHistoryFilter = {
    doctorId: doctor._id,
    endedAt: { $gte: window.previousStart, $lte: window.previousEndInclusive },
  };

  const allBuckets = [...window.previousBuckets, ...window.currentBuckets];
  const boundaries = [...allBuckets.map((bucket) => bucket.start), window.currentEndExclusive];

  const [
    activePatients,
    totalTreated,
    totalRejected,
    newPatients,
    previousNewPatients,
    treatedPatients,
    rejectedPatients,
    previousTreatedPatients,
    previousRejectedPatients,
    groupedPatients,
    recentPatients,
  ] = await Promise.all([
    patientsCollection().countDocuments(doctorFilter),
    patientHistoryCollection().countDocuments({ doctorId: doctor._id, outcome: "treated" }),
    patientHistoryCollection().countDocuments({ doctorId: doctor._id, outcome: "rejected" }),
    patientsCollection().countDocuments(currentPatientFilter),
    patientsCollection().countDocuments(previousPatientFilter),
    patientHistoryCollection().countDocuments({ ...historyFilter, outcome: "treated" }),
    patientHistoryCollection().countDocuments({ ...historyFilter, outcome: "rejected" }),
    patientHistoryCollection().countDocuments({ ...previousHistoryFilter, outcome: "treated" }),
    patientHistoryCollection().countDocuments({ ...previousHistoryFilter, outcome: "rejected" }),
    patientsCollection()
      .aggregate([
        {
          $match: {
            ...doctorFilter,
            createdAt: { $gte: window.previousStart, $lt: window.currentEndExclusive },
          },
        },
        { $bucket: { groupBy: "$createdAt", boundaries, output: { count: { $sum: 1 } } } },
      ])
      .toArray(),
    patientsCollection()
      .find(doctorFilter, { projection: PATIENT_PUBLIC_PROJECTION })
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .toArray(),
  ]);

  const currentMap = new Map(
    window.currentBuckets.map((bucket, index) => [bucket.start.getTime(), index]),
  );
  const previousMap = new Map(
    window.previousBuckets.map((bucket, index) => [bucket.start.getTime(), index]),
  );
  const buckets = window.currentBuckets.map((bucket, index) => ({
    label: bucket.label,
    current: 0,
    previous: 0,
    startDate: bucket.start.toISOString(),
    endDate: new Date(bucket.endExclusive.getTime() - 1).toISOString(),
    index,
  }));

  for (const row of groupedPatients) {
    const timestamp = new Date(row._id).getTime();
    const currentIndex = currentMap.get(timestamp);
    if (currentIndex !== undefined) {
      buckets[currentIndex].current = row.count;
      continue;
    }
    const previousIndex = previousMap.get(timestamp);
    if (previousIndex !== undefined) {
      buckets[previousIndex].previous = row.count;
    }
  }

  return {
    doctor: serializeDoctor(doctor, activePatients),
    totals: { activePatients, treated: totalTreated, rejected: totalRejected },
    current: { newPatients, treated: treatedPatients, rejected: rejectedPatients },
    previous: {
      newPatients: previousNewPatients,
      treated: previousTreatedPatients,
      rejected: previousRejectedPatients,
    },
    changes: {
      newPatientsPercent: percentChange(newPatients, previousNewPatients),
      treatedPercent: percentChange(treatedPatients, previousTreatedPatients),
      rejectedPercent: percentChange(rejectedPatients, previousRejectedPatients),
    },
    range: {
      key: window.range,
      label: window.label,
      granularity: window.granularity,
      startDate: window.currentStart.toISOString(),
      endDate: window.currentEndInclusive.toISOString(),
    },
    patientsOverTime: { buckets, currentTotal: newPatients, previousTotal: previousNewPatients },
    outcomes: { treated: treatedPatients, rejected: rejectedPatients },
    recentPatients: recentPatients.map(serializePatient),
  };
}

async function getPatientDashboardForUser(userId, range) {
  const patientDocument = await patientsCollection().findOne(
    { userId },
    { projection: { _id: 1, doctorId: 1 } },
  );
  if (!patientDocument) {
    throw ApiError.notFound("No patient record is linked to this account.");
  }

  const patient = await getPatientByUserId(userId);
  const window = getRangeWindow(range);
  const baseFilter = { patientId: patientDocument._id };
  const currentFilter = {
    ...baseFilter,
    endedAt: { $gte: window.currentStart, $lte: window.currentEndInclusive },
  };
  const previousFilter = {
    ...baseFilter,
    endedAt: { $gte: window.previousStart, $lte: window.previousEndInclusive },
  };
  const allBuckets = [...window.previousBuckets, ...window.currentBuckets];
  const boundaries = [...allBuckets.map((bucket) => bucket.start), window.currentEndExclusive];

  const [
    totalCare,
    totalTreated,
    totalRejected,
    careThisPeriod,
    carePreviousPeriod,
    treatedThisPeriod,
    rejectedThisPeriod,
    treatedPreviousPeriod,
    rejectedPreviousPeriod,
    groupedHistory,
    recentHistory,
  ] = await Promise.all([
    patientHistoryCollection().countDocuments(baseFilter),
    patientHistoryCollection().countDocuments({ ...baseFilter, outcome: "treated" }),
    patientHistoryCollection().countDocuments({ ...baseFilter, outcome: "rejected" }),
    patientHistoryCollection().countDocuments(currentFilter),
    patientHistoryCollection().countDocuments(previousFilter),
    patientHistoryCollection().countDocuments({ ...currentFilter, outcome: "treated" }),
    patientHistoryCollection().countDocuments({ ...currentFilter, outcome: "rejected" }),
    patientHistoryCollection().countDocuments({ ...previousFilter, outcome: "treated" }),
    patientHistoryCollection().countDocuments({ ...previousFilter, outcome: "rejected" }),
    patientHistoryCollection()
      .aggregate([
        {
          $match: {
            ...baseFilter,
            endedAt: { $gte: window.previousStart, $lt: window.currentEndExclusive },
          },
        },
        { $bucket: { groupBy: "$endedAt", boundaries, output: { count: { $sum: 1 } } } },
      ])
      .toArray(),
    patientHistoryCollection().find(baseFilter).sort({ endedAt: -1, _id: -1 }).limit(5).toArray(),
  ]);

  const currentMap = new Map(
    window.currentBuckets.map((bucket, index) => [bucket.start.getTime(), index]),
  );
  const previousMap = new Map(
    window.previousBuckets.map((bucket, index) => [bucket.start.getTime(), index]),
  );
  const buckets = window.currentBuckets.map((bucket, index) => ({
    label: bucket.label,
    current: 0,
    previous: 0,
    startDate: bucket.start.toISOString(),
    endDate: new Date(bucket.endExclusive.getTime() - 1).toISOString(),
    index,
  }));

  for (const row of groupedHistory) {
    const timestamp = new Date(row._id).getTime();
    const currentIndex = currentMap.get(timestamp);
    if (currentIndex !== undefined) {
      buckets[currentIndex].current = row.count;
      continue;
    }
    const previousIndex = previousMap.get(timestamp);
    if (previousIndex !== undefined) {
      buckets[previousIndex].previous = row.count;
    }
  }

  return {
    patient,
    careStatus: {
      active: Boolean(patientDocument.doctorId),
      doctor: patient.doctor,
    },
    totals: { careEpisodes: totalCare, treated: totalTreated, rejected: totalRejected },
    current: {
      careEpisodes: careThisPeriod,
      treated: treatedThisPeriod,
      rejected: rejectedThisPeriod,
    },
    previous: {
      careEpisodes: carePreviousPeriod,
      treated: treatedPreviousPeriod,
      rejected: rejectedPreviousPeriod,
    },
    changes: {
      careEpisodesPercent: percentChange(careThisPeriod, carePreviousPeriod),
      treatedPercent: percentChange(treatedThisPeriod, treatedPreviousPeriod),
      rejectedPercent: percentChange(rejectedThisPeriod, rejectedPreviousPeriod),
    },
    range: {
      key: window.range,
      label: window.label,
      granularity: window.granularity,
      startDate: window.currentStart.toISOString(),
      endDate: window.currentEndInclusive.toISOString(),
    },
    careOverTime: {
      buckets,
      currentTotal: careThisPeriod,
      previousTotal: carePreviousPeriod,
    },
    recentHistory: recentHistory.map(serializePatientHistoryEntry),
  };
}

/* ------------------------------------------------------------------ */
/* Authentication middleware                                          */
/* ------------------------------------------------------------------ */

async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return next(ApiError.unauthorized());
    }

    req.user = session.user;
    req.session = session.session;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(ApiError.forbidden());
  }
  return next();
}

function requireRole(role, message) {
  return function roleGuard(req, res, next) {
    if (req.user?.role !== role) {
      return next(ApiError.forbidden(message));
    }
    return next();
  };
}

/* ------------------------------------------------------------------ */
/* Express application                                                */
/* ------------------------------------------------------------------ */

const allowedOrigins = new Set(corsOrigins);

function rateLimitHandler(req, res) {
  return sendError(
    res,
    429,
    "RATE_LIMITED",
    "Too many requests. Please wait a moment and try again.",
  );
}

function notFoundHandler(req, res) {
  return sendError(
    res,
    404,
    "NOT_FOUND",
    `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
  );
}

function errorHandler(error, req, res, _next) {
  if (error instanceof ApiError) {
    return sendError(res, error.status, error.code, error.message, error.details);
  }

  if (error?.name === "ZodError") {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Please check the submitted values and try again.",
      { issues: error.issues },
    );
  }

  if (error?.type === "entity.parse.failed" || error?.status === 400) {
    return sendError(res, 400, "VALIDATION_ERROR", "The request body must contain valid JSON.");
  }

  if (error?.code === 11000) {
    return sendError(res, 409, "CONFLICT", "A record with that unique value already exists.");
  }

  if (error?.name === "CastError") {
    return sendError(res, 400, "VALIDATION_ERROR", "The supplied identifier is invalid.");
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(`[api] ${error?.name ?? "Error"}: ${error?.message ?? "unknown failure"}`);
    if (error?.stack) {
      console.error(error.stack);
    }
  } else {
    console.error("[api] Unhandled server error.");
  }

  return sendError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed by CORS."));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  const parseJson = express.json({ limit: "1mb" });
  app.use((req, res, next) => {
    parseJson(req, res, (error) => {
      if (error?.type === "entity.parse.failed" || error?.status === 400) {
        return sendError(res, 400, "VALIDATION_ERROR", "The request body must contain valid JSON.");
      }
      return next(error);
    });
  });

  app.get("/health", (req, res) => sendSuccess(res, { status: "ok", environment: env.NODE_ENV }));

  const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

  const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

  const publicWriteLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

  const api = express.Router();

  api.use(readLimiter);
  api.use((req, res, next) => {
    if (["POST", "PATCH", "DELETE"].includes(req.method)) {
      return writeLimiter(req, res, next);
    }
    return next();
  });

  // Public routes must be registered before the session guard below.
  api.get(
    "/public/doctors/options",
    validate({ query: doctorOptionsQuerySchema }),
    asyncHandler(async (req, res) => {
      const options = await listDoctorOptions(req.validated.query);
      return sendSuccess(res, options);
    }),
  );

  api.post(
    "/public/registrations/doctors",
    publicWriteLimiter,
    requireJson,
    validate({ body: publicDoctorRegistrationSchema }),
    asyncHandler(async (req, res) => {
      const registration = await createDoctorRegistration(req.validated.body);
      return sendSuccess(res, registration, undefined, 201);
    }),
  );

  api.post(
    "/public/registrations/patients",
    publicWriteLimiter,
    requireJson,
    validate({ body: publicPatientRegistrationSchema }),
    asyncHandler(async (req, res) => {
      const registration = await createPatientRegistration(req.validated.body);
      return sendSuccess(res, registration, undefined, 201);
    }),
  );

  api.use(requireAuth);

  // Portal routes resolve the directory record from the authenticated session,
  // never from the client. Doctors and patients may update only their own
  // profile; a patient may also change their own assigned doctor.
  api.get(
    "/portal/doctor",
    requireRole("doctor", "Doctor access required."),
    asyncHandler(async (req, res) => {
      const doctor = await getDoctorByUserId(req.user.id);
      return sendSuccess(res, doctor);
    }),
  );

  api.patch(
    "/portal/doctor",
    requireRole("doctor", "Doctor access required."),
    requireJson,
    validate({ body: doctorSelfUpdateSchema }),
    asyncHandler(async (req, res) => {
      const doctor = await updateDoctorByUserId(req.user.id, req.validated.body);
      await syncAuthDisplayName(req.user, req.validated.body.name, fromNodeHeaders(req.headers));
      return sendSuccess(res, doctor);
    }),
  );

  api.get(
    "/portal/doctor/dashboard",
    requireRole("doctor", "Doctor access required."),
    validate({ query: dashboardRangeQuerySchema }),
    asyncHandler(async (req, res) => {
      const dashboard = await getDoctorDashboardForUser(req.user.id, req.validated.query.range);
      return sendSuccess(res, dashboard);
    }),
  );

  api.get(
    "/portal/doctor/patients",
    requireRole("doctor", "Doctor access required."),
    validate({ query: patientListQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await listDoctorPatientsForUser(req.user.id, req.validated.query);
      return sendSuccess(res, result.patients, result.meta);
    }),
  );

  api.get(
    "/portal/doctor/history",
    requireRole("doctor", "Doctor access required."),
    validate({ query: patientHistoryQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await listDoctorHistoryForUser(req.user.id, req.validated.query);
      return sendSuccess(res, result.entries, result.meta);
    }),
  );

  api.post(
    "/portal/doctor/patients/:id/treatment",
    requireRole("doctor", "Doctor access required."),
    requireJson,
    validate({ params: idParamsSchema, body: patientTreatmentSchema }),
    asyncHandler(async (req, res) => {
      const entry = await recordPatientOutcomeForUser(
        req.user.id,
        req.validated.params.id,
        req.validated.body.outcome,
      );
      return sendSuccess(res, entry);
    }),
  );

  api.get(
    "/portal/patient",
    requireRole("patient", "Patient access required."),
    asyncHandler(async (req, res) => {
      const patient = await getPatientByUserId(req.user.id);
      return sendSuccess(res, patient);
    }),
  );

  api.get(
    "/portal/patient/dashboard",
    requireRole("patient", "Patient access required."),
    validate({ query: dashboardRangeQuerySchema }),
    asyncHandler(async (req, res) => {
      const dashboard = await getPatientDashboardForUser(req.user.id, req.validated.query.range);
      return sendSuccess(res, dashboard);
    }),
  );

  api.patch(
    "/portal/patient",
    requireRole("patient", "Patient access required."),
    requireJson,
    validate({ body: patientSelfUpdateSchema }),
    asyncHandler(async (req, res) => {
      const patient = await updatePatientByUserId(req.user.id, req.validated.body);
      await syncAuthDisplayName(req.user, req.validated.body.name, fromNodeHeaders(req.headers));
      return sendSuccess(res, patient);
    }),
  );

  api.patch(
    "/portal/patient/doctor",
    requireRole("patient", "Patient access required."),
    requireJson,
    validate({ body: patientDoctorUpdateSchema }),
    asyncHandler(async (req, res) => {
      const patient = await changePatientDoctorByUserId(req.user.id, req.validated.body.doctorId);
      return sendSuccess(res, patient);
    }),
  );

  api.get(
    "/portal/patient/history",
    requireRole("patient", "Patient access required."),
    validate({ query: patientHistoryQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await listPatientHistoryForUser(req.user.id, req.validated.query);
      return sendSuccess(res, result.entries, result.meta);
    }),
  );

  api.use(requireAdmin);

  api.get(
    "/registration-requests",
    validate({ query: registrationRequestListQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await listRegistrationRequests(req.validated.query);
      return sendSuccess(res, result.requests, result.meta);
    }),
  );

  api.post(
    "/registration-requests/:id/approve",
    validate({ params: idParamsSchema }),
    asyncHandler(async (req, res) => {
      const result = await approveRegistrationRequest(
        req.validated.params.id,
        fromNodeHeaders(req.headers),
      );
      return sendSuccess(res, result);
    }),
  );

  api.delete(
    "/registration-requests/:id",
    validate({ params: idParamsSchema }),
    asyncHandler(async (req, res) => {
      await deletePendingRegistrationRequest(req.validated.params.id);
      return sendNoContent(res);
    }),
  );

  api.get(
    "/doctors",
    validate({ query: doctorListQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await listDoctors(req.validated.query);
      return sendSuccess(res, result.doctors, result.meta);
    }),
  );

  api.post(
    "/doctors",
    requireJson,
    validate({ body: doctorCreateSchema }),
    asyncHandler(async (req, res) => {
      const doctor = await createDoctor(req.validated.body);
      return sendSuccess(res, doctor, undefined, 201);
    }),
  );

  api.get(
    "/doctors/options",
    validate({ query: doctorOptionsQuerySchema }),
    asyncHandler(async (req, res) => {
      const options = await listDoctorOptions(req.validated.query);
      return sendSuccess(res, options);
    }),
  );

  api.get(
    "/doctors/:id/patients",
    validate({ params: idParamsSchema, query: patientListQuerySchema }),
    asyncHandler(async (req, res) => {
      const doctorId = req.validated.params.id;
      await getDoctorById(doctorId);
      const result = await listPatients({ ...req.validated.query, doctorId });
      return sendSuccess(res, result.patients, result.meta);
    }),
  );

  api.get(
    "/doctors/:id",
    validate({ params: idParamsSchema }),
    asyncHandler(async (req, res) => {
      const doctor = await getDoctorById(req.validated.params.id);
      return sendSuccess(res, doctor);
    }),
  );

  api.patch(
    "/doctors/:id",
    requireJson,
    validate({ params: idParamsSchema, body: doctorUpdateSchema }),
    asyncHandler(async (req, res) => {
      const doctor = await updateDoctor(req.validated.params.id, req.validated.body);
      return sendSuccess(res, doctor);
    }),
  );

  api.delete(
    "/doctors/:id",
    validate({ params: idParamsSchema }),
    asyncHandler(async (req, res) => {
      const deleted = await deleteDoctor(req.validated.params.id);
      await removeAuthUserBestEffort(deleted.userId, fromNodeHeaders(req.headers));
      return sendNoContent(res);
    }),
  );

  api.get(
    "/patients",
    validate({ query: patientListQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await listPatients(req.validated.query);
      return sendSuccess(res, result.patients, result.meta);
    }),
  );

  api.post(
    "/patients",
    requireJson,
    validate({ body: patientCreateSchema }),
    asyncHandler(async (req, res) => {
      const patient = await createPatient(req.validated.body);
      return sendSuccess(res, patient, undefined, 201);
    }),
  );

  api.get(
    "/patients/:id",
    validate({ params: idParamsSchema }),
    asyncHandler(async (req, res) => {
      const patient = await getPatientById(req.validated.params.id);
      return sendSuccess(res, patient);
    }),
  );

  api.patch(
    "/patients/:id",
    requireJson,
    validate({ params: idParamsSchema, body: patientUpdateSchema }),
    asyncHandler(async (req, res) => {
      const patient = await updatePatient(req.validated.params.id, req.validated.body);
      return sendSuccess(res, patient);
    }),
  );

  api.delete(
    "/patients/:id",
    validate({ params: idParamsSchema }),
    asyncHandler(async (req, res) => {
      const deleted = await deletePatient(req.validated.params.id);
      await removeAuthUserBestEffort(deleted.userId, fromNodeHeaders(req.headers));
      return sendNoContent(res);
    }),
  );

  api.get(
    "/dashboard/summary",
    validate({ query: dashboardRangeQuerySchema }),
    asyncHandler(async (req, res) => {
      const summary = await getDashboardSummary(req.validated.query.range);
      return sendSuccess(res, summary);
    }),
  );

  api.get(
    "/dashboard/patients-per-doctor",
    asyncHandler(async (req, res) => {
      const result = await getPatientsPerDoctor();
      return sendSuccess(res, result.items, result.meta);
    }),
  );

  api.get(
    "/dashboard/patients-over-time",
    validate({ query: dashboardRangeQuerySchema }),
    asyncHandler(async (req, res) => {
      const result = await getPatientsOverTime(req.validated.query.range);
      return sendSuccess(res, result);
    }),
  );

  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/* ------------------------------------------------------------------ */
/* Seed data                                                          */
/* ------------------------------------------------------------------ */

const SEED_DOCTORS = [
  ["Maya Patel", "Cardiology", "Riverside Hospital"],
  ["James Wilson", "General medicine", "Oakwood Medical Center"],
  ["Olivia Chen", "Pediatrics", "Riverside Hospital"],
  ["Noah Williams", "Neurology", "Northgate Hospital"],
  ["Emma Davis", "Dermatology", "Oakwood Medical Center"],
  ["Ethan Brooks", "Orthopedics", "Northgate Hospital"],
  ["Sofia Martinez", "General medicine", "Riverside Hospital"],
  ["Liam Taylor", "Endocrinology", "Oakwood Medical Center"],
  ["Ava Thompson", "Cardiology", "Northgate Hospital"],
  ["Lucas Anderson", "General medicine", "Summit Clinic"],
  ["Mia Garcia", "Pediatrics", "Oakwood Medical Center"],
  ["Henry Lee", "Neurology", "Riverside Hospital"],
  ["Isabella Walker", "Dermatology", "Northgate Hospital"],
  ["Benjamin Hall", "Orthopedics", "Summit Clinic"],
  ["Amelia Young", "Endocrinology", "Riverside Hospital"],
  ["Elijah King", "Pulmonology", "Oakwood Medical Center"],
  ["Harper Scott", "Gastroenterology", "Northgate Hospital"],
  ["Daniel Green", "Psychiatry", "Summit Clinic"],
  ["Evelyn Adams", "Ophthalmology", "Riverside Hospital"],
  ["Michael Baker", "Otolaryngology", "Oakwood Medical Center"],
  ["Abigail Nelson", "Pediatrics", "Northgate Hospital"],
  ["Alexander Carter", "Cardiology", "Summit Clinic"],
  ["Emily Mitchell", "General medicine", "Riverside Hospital"],
  ["David Perez", "Neurology", "Oakwood Medical Center"],
];

const SEED_PATIENT_COUNTS = [
  28, 24, 22, 20, 18, 18, 16, 16, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 12,
];

const SEED_FIRST_NAMES = [
  "Amelia",
  "Benjamin",
  "Charlotte",
  "Daniel",
  "Isabella",
  "Lucas",
  "Mia",
  "Henry",
  "Evelyn",
  "Oliver",
  "Grace",
  "Samuel",
  "Ava",
  "Noah",
  "Sophia",
  "Liam",
  "Harper",
  "Elijah",
  "Abigail",
  "Alexander",
  "Emily",
  "David",
  "Chloe",
  "Jack",
  "Lily",
  "Matthew",
  "Zoe",
  "James",
  "Ella",
  "Nathan",
  "Scarlett",
  "Leo",
  "Nora",
  "Ryan",
  "Hannah",
  "Owen",
  "Aria",
  "Caleb",
  "Layla",
  "Julian",
];

const SEED_LAST_NAMES = [
  "Wright",
  "Harris",
  "Lewis",
  "Robinson",
  "Clark",
  "Walker",
  "Thompson",
  "Anderson",
  "Moore",
  "Martin",
  "Jackson",
  "White",
  "Taylor",
  "Lee",
  "Perez",
  "Garcia",
  "Martinez",
  "Davis",
  "Brooks",
  "Mitchell",
  "Nelson",
  "Carter",
  "Scott",
  "Green",
  "Adams",
  "Baker",
  "Young",
  "King",
  "Hall",
  "Wilson",
  "Patel",
  "Chen",
  "Williams",
  "Brooks",
  "Evans",
  "Murphy",
  "Cooper",
  "Rivera",
  "Cox",
  "Reed",
];

const SEED_CONDITIONS = [
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

const SEED_GENDERS = ["female", "male", "female", "male", "female", "male", "other"];

const seedEnvSchema = z.object({
  SEED_ADMIN_NAME: z.string().min(2).default("Alex Lee"),
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
});

function seedPhoneFor(index) {
  return `(415) 555-${String(1000 + index).slice(-4)}`;
}

function seedSlugEmail(name, index) {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
  return `${slug}.${index}@example.com`;
}

function seedDaysAgo(days, hours = 0) {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000);
}

async function provisionAdmin(seedAdmin) {
  try {
    await auth.api.createUser({
      body: {
        name: seedAdmin.SEED_ADMIN_NAME,
        email: seedAdmin.SEED_ADMIN_EMAIL,
        password: seedAdmin.SEED_ADMIN_PASSWORD,
        role: "admin",
      },
    });
    console.info("[seed] Administrator account created.");
  } catch (error) {
    const message = error?.body?.message ?? error?.message ?? "";
    if (/already exists/i.test(message)) {
      console.info("[seed] Administrator account already exists; leaving it unchanged.");
      return;
    }
    throw error;
  }
}

function seededShuffle(values) {
  const result = [...values];
  let seed = 20261031;
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function buildSeedPatients(doctorIds) {
  const now = Date.now();
  const patients = [];
  const doctorSlots = seededShuffle(
    SEED_PATIENT_COUNTS.flatMap((count, doctorIndex) =>
      Array.from({ length: count }, () => doctorIndex),
    ),
  );
  let globalIndex = 0;

  for (const count of SEED_PATIENT_COUNTS) {
    for (let i = 0; i < count; i += 1) {
      const first = SEED_FIRST_NAMES[globalIndex % SEED_FIRST_NAMES.length];
      const last =
        SEED_LAST_NAMES[Math.floor(globalIndex / SEED_FIRST_NAMES.length) % SEED_LAST_NAMES.length];
      const name =
        globalIndex === 0
          ? "Amelia Wright"
          : globalIndex === 1
            ? "Benjamin Harris"
            : globalIndex === 2
              ? "Charlotte Lewis"
              : globalIndex === 3
                ? "Daniel Robinson"
                : `${first} ${last}`;

      const spreadDays = (globalIndex % 120) + 1;
      const createdAt =
        globalIndex < 4
          ? new Date(now - (globalIndex + 1) * 2 * 3_600_000)
          : new Date(now - spreadDays * 86_400_000 - (globalIndex % 24) * 3_600_000);

      patients.push({
        name,
        age: globalIndex % 13 === 0 ? 8 + (globalIndex % 10) : 18 + ((globalIndex * 7) % 70),
        gender: SEED_GENDERS[globalIndex % SEED_GENDERS.length],
        condition: SEED_CONDITIONS[globalIndex % SEED_CONDITIONS.length],
        phone: seedPhoneFor(globalIndex),
        ...(globalIndex % 3 === 0 ? { email: seedSlugEmail(name, globalIndex) } : {}),
        doctorId: doctorIds[doctorSlots[globalIndex]],
        createdAt,
        updatedAt: createdAt,
      });

      globalIndex += 1;
    }
  }

  return patients;
}

async function runSeed() {
  const parsedSeedEnv = seedEnvSchema.safeParse(process.env);
  if (!parsedSeedEnv.success) {
    throw new Error(
      "Seed credentials are missing. Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env.",
    );
  }
  const seedAdmin = parsedSeedEnv.data;

  const db = getDb();
  await db.command({ ping: 1 });
  await ensureIndexes();
  await provisionAdmin(seedAdmin);

  const doctors = db.collection("doctors");
  const patients = db.collection("patients");

  await Promise.all([
    patients.deleteMany({}),
    doctors.deleteMany({}),
    registrationRequestsCollection().deleteMany({ status: "approved" }),
  ]);

  const doctorDocuments = SEED_DOCTORS.map(([name, specialization, hospital], index) => {
    const createdAt = seedDaysAgo(2 + index * 3);
    return {
      name: `Dr. ${name}`,
      specialization,
      hospital,
      phone: seedPhoneFor(200 + index),
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const doctorResult = await doctors.insertMany(doctorDocuments);
  const doctorIds = Object.values(doctorResult.insertedIds);
  const patientDocuments = buildSeedPatients(doctorIds);
  await patients.insertMany(patientDocuments);

  console.info(
    `[seed] Inserted ${doctorDocuments.length} doctors and ${patientDocuments.length} patients.`,
  );
  console.info(`[seed] Sign in with ${seedAdmin.SEED_ADMIN_EMAIL}.`);
}

async function promoteSeedAdmin() {
  const email = env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error("Set SEED_ADMIN_EMAIL in server/.env before promoting the administrator.");
  }

  const users = getDb().collection("user");
  const matches = await users
    .find({ email }, { projection: { _id: 1, role: 1 } })
    .limit(2)
    .toArray();
  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? "No Better Auth user matches SEED_ADMIN_EMAIL; no changes were made."
        : "Multiple Better Auth users match SEED_ADMIN_EMAIL; no changes were made.",
    );
  }

  if (matches[0].role === "admin") {
    console.info("[auth] Configured administrator already has the admin role.");
    return;
  }

  const result = await users.updateOne({ _id: matches[0]._id, email }, { $set: { role: "admin" } });
  if (result.modifiedCount !== 1) {
    throw new Error("The administrator role could not be updated; no other users were changed.");
  }
  console.info(
    "[auth] Configured administrator promoted. Sign out and sign in again to refresh the session.",
  );
}

/* ------------------------------------------------------------------ */
/* Startup and CLI                                                    */
/* ------------------------------------------------------------------ */

function mongoTargetLabel() {
  try {
    return new URL(authEnv.MONGODB_URI).host;
  } catch {
    return "configured MongoDB";
  }
}

async function runIndexes() {
  await getDb().command({ ping: 1 });
  await ensureIndexes();
  console.info(`[db] Indexes verified for database "${env.MONGODB_DB}".`);
}

async function startServer() {
  await getDb().command({ ping: 1 });
  console.info(`[db] Connected to ${mongoTargetLabel()} (database: ${authEnv.MONGODB_DB}).`);

  await ensureIndexes();
  console.info("[db] Indexes verified.");

  const app = createApp();
  const server = app.listen(env.PORT, "0.0.0.0" () => {
    console.info(`[api] Doctor Tracker API listening on port ${env.PORT}.`);
  });

  async function shutdown(signal) {
    console.info(`[api] Received ${signal}. Shutting down.`);
    server.close(async () => {
      await closeAuthConnection();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

async function main() {
  const command = process.argv[2] ?? "serve";

  if (command === "seed") {
    await runSeed();
    await closeAuthConnection();
    return;
  }

  if (command === "indexes") {
    await runIndexes();
    await closeAuthConnection();
    return;
  }

  if (command === "promote-admin") {
    await promoteSeedAdmin();
    await closeAuthConnection();
    return;
  }

  await startServer();
}

main().catch(async (error) => {
  console.error(`[api] Failed: ${error.message}`);
  await closeAuthConnection().catch(() => {});
  process.exitCode = 1;
});
