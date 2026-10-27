"use client";

import { startTransition, useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { landingLocked } from "@/lib/landingLinks";
import { submitCmsForm } from "@/service/formSubmission";

const INPUT_TYPES = { text: "text", email: "email", phone: "tel", number: "number", date: "date" };
const AUTOCOMPLETE = { email: "email", phone: "tel" };
const initialState = { status: "idle", message: "", fieldErrors: {} };

// `pattern` is left to the API: HTML patterns must match the whole value, the API's regex doesn't.
function validationProps(field) {
  const rules = field.validation || {};
  return { minLength: rules.minLength, maxLength: rules.maxLength, min: rules.min, max: rules.max };
}

function FieldControl({ field, inputId, describedBy, invalid }) {
  const common = {
    id: inputId,
    name: field.name,
    required: field.required,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };
  const options = Array.isArray(field.options) ? field.options : [];

  switch (field.type) {
    case "textarea":
      return <textarea {...common} rows={4} placeholder={field.placeholder} defaultValue={field.defaultValue || ""} {...validationProps(field)} />;

    case "select":
      return (
        <select {...common} defaultValue={field.defaultValue || ""}>
          <option value="" disabled>{field.placeholder || "Select an option"}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      );

    case "radio":
      return (
        <div className="cms-choice-group" role="radiogroup" aria-describedby={describedBy}>
          {options.map((option) => (
            <label key={option.value} className="cms-choice">
              <input type="radio" name={field.name} value={option.value} required={field.required} defaultChecked={field.defaultValue === option.value} />
              {option.label}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      if (!options.length) {
        return (
          <label className="cms-choice">
            <input {...common} type="checkbox" value="true" defaultChecked={Boolean(field.defaultValue)} />
            <span>{field.label}{field.required && <span className="cms-req"> *</span>}</span>
          </label>
        );
      }
      return (
        <div className="cms-choice-group" aria-describedby={describedBy}>
          {options.map((option) => (
            <label key={option.value} className="cms-choice">
              <input type="checkbox" name={field.name} value={option.value} />
              {option.label}
            </label>
          ))}
        </div>
      );

    default:
      return (
        <input
          {...common}
          type={INPUT_TYPES[field.type] || "text"}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue || ""}
          autoComplete={AUTOCOMPLETE[field.type]}
          {...validationProps(field)}
        />
      );
  }
}

/**
 * Renders a CMS form definition (payload.form from a "Form" section) and submits it
 * through the submitCmsForm Server Action. `compact` stacks every field in one column.
 */
export default function CmsForm({ form, compact = false }) {
  const router = useRouter();
  const baseId = useId();
  const identifier = form?.slug || form?.id;
  const [state, formAction, pending] = useActionState(submitCmsForm.bind(null, identifier), initialState);

  useEffect(() => {
    if (state.status !== "success" || !state.redirectUrl) return;
    if (landingLocked()) return; // landing pages: the success message stays, no redirect away
    if (state.redirectUrl.startsWith("/")) router.push(state.redirectUrl);
    else window.location.assign(state.redirectUrl);
  }, [state, router]);

  const fields = Array.isArray(form?.fields) ? form.fields.filter((field) => field?.name) : [];
  if (!identifier || !fields.length) return null;

  if (state.status === "success") {
    return <div className="cms-form-success" role="status">✅ {state.message}</div>;
  }

  // Submit via onSubmit instead of <form action> so React doesn't clear what the visitor typed
  // when the API rejects the submission.
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form className={`cms-form${compact ? " cms-form-compact" : ""}`} onSubmit={handleSubmit}>
      <div className="cms-form-grid">
        {fields.map((field) => {
          const inputId = `${baseId}-${field.name}`;
          const error = state.fieldErrors?.[field.name];
          const helpId = field.helpText ? `${inputId}-help` : undefined;
          const errorId = error ? `${inputId}-error` : undefined;
          const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

          if (field.type === "hidden") {
            return <input key={field.name} type="hidden" name={field.name} defaultValue={field.defaultValue || ""} />;
          }

          const singleCheckbox = field.type === "checkbox" && !field.options?.length;
          const width = !compact && field.width === "half" ? " field-half" : "";

          return (
            <div key={field.id || field.name} className={`field${width}${error ? " field-invalid" : ""}`}>
              {!singleCheckbox && (
                <label htmlFor={inputId} className="cms-label">
                  {field.label}{field.required && <span className="cms-req"> *</span>}
                </label>
              )}
              <FieldControl field={field} inputId={inputId} describedBy={describedBy} invalid={Boolean(error)} />
              {field.helpText && <small id={helpId} className="cms-help">{field.helpText}</small>}
              {error && <small id={errorId} className="cms-error">{error}</small>}
            </div>
          );
        })}
      </div>

      {/* Honeypot: hidden from people, filled in by bots; the API silently drops those submissions. */}
      <input type="text" name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="cms-hp" />

      {state.status === "error" && <p className="cms-form-error" role="alert">{state.message}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Submitting…" : form.settings?.submitButtonText || "Submit"}
      </button>
    </form>
  );
}
