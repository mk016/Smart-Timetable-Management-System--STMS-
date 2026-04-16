"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

type FieldType = "text" | "number" | "boolean" | "textarea" | "csv" | "select";

export interface EntityField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  arraySubtype?: "text" | "number";
}

function normalizeValue(field: EntityField, value: unknown) {
  if (field.type === "boolean") {
    return Boolean(value);
  }
  if (field.type === "csv") {
    return Array.isArray(value) ? value.join(", ") : "";
  }
  return value ?? "";
}

function denormalizeValue(field: EntityField, value: string | boolean) {
  if (field.type === "number") {
    return Number(value);
  }
  if (field.type === "boolean") {
    return Boolean(value);
  }
  if (field.type === "csv") {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (field.arraySubtype === "number" ? Number(item) : item));
  }
  return value;
}

export function EntityManager({
  title,
  description,
  apiBase,
  initialItems,
  fields
}: {
  title: string;
  description: string;
  apiBase: string;
  initialItems: any[];
  fields: EntityField[];
}) {
  function buildFormState(source?: Record<string, any>) {
    return fields.reduce<Record<string, string | boolean>>((acc, field) => {
      const fallback = field.type === "boolean" ? false : "";
      acc[field.key] = source ? (normalizeValue(field, source[field.key]) as string | boolean) : fallback;
      return acc;
    }, {});
  }

  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<Record<string, string | boolean>>(buildFormState());
  const [isFormOpen, setIsFormOpen] = useState(false);

  const visibleColumns = useMemo(() => fields.slice(0, 4), [fields]);

  function resetForm() {
    setEditingId(null);
    setIsFormOpen(false);
    setForm(buildFormState());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = Object.fromEntries(
      fields.map((field) => [field.key, denormalizeValue(field, form[field.key] ?? "")])
    );

    const response = await fetch(editingId ? `${apiBase}/${editingId}` : apiBase, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.error || "Save failed");
      return;
    }

    setItems(result.items || result.item ? result.items || [result.item] : items);
    if (result.items) {
      setItems(result.items);
    } else if (result.item) {
      setItems((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? result.item : item))
          : [result.item, ...current]
      );
    }
    setMessage(editingId ? "Updated successfully." : "Created successfully.");
    resetForm();
  }

  return (
    <div className="relative">
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Master Data</p>
            <h1 className="mt-3 font-serif text-4xl uppercase tracking-tight text-ink">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60">{description}</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-accent"
            type="button"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-ink/10">
          <table className="min-w-full divide-y divide-ink/10 text-left">
            <thead className="bg-canvas/70 text-xs uppercase tracking-[0.2em] text-ink/50">
              <tr>
                {visibleColumns.map((field) => (
                  <th key={field.key} className="px-4 py-4 font-medium">
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 bg-white text-sm text-ink/70">
              {items.map((item) => (
                <tr key={String(item.id)}>
                  {visibleColumns.map((field) => (
                    <td key={field.key} className="px-4 py-4 align-top">
                      {Array.isArray(item[field.key]) ? (item[field.key] as unknown[]).join(", ") : String(item[field.key] ?? "-")}
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-ink/10 p-2 transition hover:border-accent hover:text-accent"
                        type="button"
                        onClick={() => {
                          setEditingId(String(item.id));
                          setForm(buildFormState(item));
                          setIsFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-full border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        type="button"
                        onClick={async () => {
                          const response = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
                          const result = await response.json();
                          if (response.ok) {
                            setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
                            setMessage(result.message || "Deleted.");
                          } else {
                            setMessage(result.error || "Delete failed");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-forest p-6 text-white shadow-halo max-h-[90vh] overflow-y-auto"
            onSubmit={handleSubmit}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">
                  {editingId ? "Update Record" : "Create Record"}
                </p>
                <h2 className="mt-3 font-serif text-3xl uppercase tracking-tight">
                  {editingId ? "Edit Entry" : `Add ${title.slice(0, -1)}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full p-2 hover:bg-white/10 transition"
              >
                <Trash2 className="h-4 w-4 opacity-0 pointer-events-none" /> {/* Placeholder for visual balance or use an X icon if imported */}
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-accent"
                      value={String(form[field.key] ?? "")}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                    />
                  ) : field.type === "boolean" ? (
                    <input
                      checked={Boolean(form[field.key])}
                      className="h-5 w-5 rounded border-white/20 bg-white/5 accent-accent"
                      type="checkbox"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.key]: event.target.checked }))
                      }
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-accent"
                      value={String(form[field.key] ?? "")}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                    >
                      <option value="">Select</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-accent"
                      placeholder={field.placeholder}
                      type={field.type === "number" ? "number" : "text"}
                      value={String(form[field.key] ?? "")}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>

            {message ? <p className="mt-4 text-sm text-white/70">{message}</p> : null}

            <div className="mt-8 flex gap-3">
              <button
                className="rounded-full bg-accent flex-1 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-ink"
                disabled={loading}
                type="submit"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                className="rounded-full border border-white/10 flex-1 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
                onClick={resetForm}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
