const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("en-GB");

export function formatDate(value) {
  if (!value) {
    return "—";
  }
  return dateFormatter.format(new Date(value));
}

export function formatShortDate(value) {
  if (!value) {
    return "—";
  }
  return shortDateFormatter.format(new Date(value));
}

export function formatDateRange(startValue, endValue) {
  if (!startValue || !endValue) {
    return "";
  }
  const start = new Date(startValue);
  const end = new Date(endValue);
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();

  if (sameMonth) {
    return `${String(start.getUTCDate()).padStart(2, "0")}–${String(end.getUTCDate()).padStart(
      2,
      "0",
    )} ${monthYearFormatter.format(end)}`;
  }

  return `${shortDateFormatter.format(start)} – ${dateFormatter.format(end)}`;
}

export function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

export function formatAverage(value) {
  return Number(value ?? 0).toFixed(1);
}

export function formatPercent(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function initials(name = "") {
  const cleaned = name.replace(/^Dr\.?\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function genderShort(gender) {
  if (gender === "male") {
    return "M";
  }
  if (gender === "female") {
    return "F";
  }
  return "O";
}

export function formatAgeSex(age, gender) {
  return `${age} / ${genderShort(gender)}`;
}

export function reference(prefix, id) {
  if (!id) {
    return `${prefix}-—`;
  }
  return `${prefix}-${String(id).slice(-4).toUpperCase()}`;
}

export function rangeSubtitle(granularity) {
  if (granularity === "day") {
    return "New patients by day";
  }
  if (granularity === "month") {
    return "New patients by month";
  }
  return "New patients by week";
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

export function padNumber(value) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(iso) {
  if (!iso) {
    return "";
  }
  return new Date(iso).toISOString().slice(0, 10);
}
