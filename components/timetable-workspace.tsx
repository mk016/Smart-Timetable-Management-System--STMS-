"use client";

import { DragEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Grip,
  LayoutGrid,
  Move,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AppData, Conflict, TimetableEntry, WEEK_DAYS, WeekDay } from "@/lib/types";

type ViewMode = "week" | "day";
type DropTarget = { dayOfWeek: WeekDay; slotIndex: number };

const SUBJECT_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", accent: "bg-blue-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", accent: "bg-emerald-500" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", accent: "bg-violet-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", accent: "bg-amber-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", accent: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-800", accent: "bg-cyan-500" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", accent: "bg-pink-500" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", accent: "bg-teal-500" },
];

function getMeta(data: AppData, entry: TimetableEntry) {
  return {
    batch: data.batches.find((item) => item.id === entry.batchId)?.batchName || entry.batchId,
    subject: data.subjects.find((item) => item.id === entry.subjectId)?.subjectName || entry.subjectId,
    teacher: data.teachers.find((item) => item.id === entry.teacherId)?.name || entry.teacherId,
    room: data.rooms.find((item) => item.id === entry.roomId)?.roomName || entry.roomId
  };
}

export function TimetableWorkspace({
  initialData,
  readOnly = false
}: {
  initialData: AppData;
  readOnly?: boolean;
}) {
  const defaultFilter =
    initialData.timetableEntries.length > 0 &&
    initialData.timetableEntries.every((entry) => entry.batchId === initialData.timetableEntries[0].batchId)
      ? initialData.timetableEntries[0].batchId
      : "";

  const [data, setData] = useState(initialData);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [note, setNote] = useState("");
  const [batchFilter, setBatchFilter] = useState(defaultFilter);
  const [loading, setLoading] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedMoveEntryId, setSelectedMoveEntryId] = useState<string | null>(null);
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editForm, setEditForm] = useState({ teacherId: "", roomId: "", dayOfWeek: "", slotStart: "" });
  const [holidayForm, setHolidayForm] = useState({ holidayDate: "", holidayName: "" });
  const [leaveForm, setLeaveForm] = useState({
    teacherId: initialData.teachers[0]?.id || "",
    leaveDate: "",
    reason: ""
  });

  // Build a color map for subjects
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, typeof SUBJECT_COLORS[0]>();
    data.subjects.forEach((subject, index) => {
      map.set(subject.id, SUBJECT_COLORS[index % SUBJECT_COLORS.length]);
    });
    return map;
  }, [data.subjects]);

  const daySlots = useMemo(
    () =>
      Array.from(
        new Map(
          data.slots
            .filter((slot) => slot.active)
            .sort((left, right) => left.slotIndex - right.slotIndex)
            .map((slot) => [slot.slotIndex, slot])
        ).values()
      ),
    [data.slots]
  );

  const visibleEntries = useMemo(() => {
    if (!batchFilter) return data.timetableEntries;
    return data.timetableEntries.filter((entry) => entry.batchId === batchFilter);
  }, [batchFilter, data.timetableEntries]);

  const movableEntryId = draggedEntryId || selectedMoveEntryId;
  const movableEntry = data.timetableEntries.find((entry) => entry.id === movableEntryId) || null;
  const activeDay = WEEK_DAYS[activeDayIndex];

  async function refreshData() {
    const response = await fetch("/api/timetable");
    const payload = await response.json();
    setData(payload.data);
    setConflicts([]);
    setNote("Latest timetable reloaded.");
    setSelectedMoveEntryId(null);
    setDraggedEntryId(null);
    setDropTarget(null);
  }

  async function mutateAction(
    key: string,
    executor: () => Promise<{ ok: boolean; payload: Record<string, unknown> }>
  ) {
    setLoading(key);
    setNote("");
    const result = await executor();
    setLoading("");
    if (result.ok) {
      const nextData = result.payload.data as AppData | undefined;
      if (nextData) setData(nextData);
      const nextConflicts = result.payload.conflicts as Conflict[] | undefined;
      setConflicts(nextConflicts ?? []);
      setNote(String(result.payload.message || "Action completed."));
    } else {
      const nextConflicts = result.payload.conflicts as Conflict[] | undefined;
      if (nextConflicts) setConflicts(nextConflicts);
      setNote(String(result.payload.error || "Action failed."));
    }
  }

  function entryCanStartAt(entry: TimetableEntry, dayOfWeek: WeekDay, slotIndex: number) {
    return entry.slotIndexes.every((_, offset) =>
      data.slots.some(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.slotIndex === slotIndex + offset && slot.active
      )
    );
  }

  async function moveEntry(entryId: string, dayOfWeek: WeekDay, slotStart: number) {
    await mutateAction("move-entry", async () => {
      const response = await fetch(`/api/timetable/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, slotStart, isLocked: true })
      });
      return { ok: response.ok, payload: await response.json() };
    });
    setSelectedMoveEntryId(null);
    setDraggedEntryId(null);
    setDropTarget(null);
  }

  function handleDropAttempt(dayOfWeek: WeekDay, slotIndex: number) {
    if (!movableEntry || !entryCanStartAt(movableEntry, dayOfWeek, slotIndex)) return;
    void moveEntry(movableEntry.id, dayOfWeek, slotIndex);
  }

  function openEditModal(entry: TimetableEntry) {
    if (readOnly) return;
    setEditingEntry(entry);
    setEditForm({
      teacherId: entry.teacherId,
      roomId: entry.roomId,
      dayOfWeek: entry.dayOfWeek,
      slotStart: String(entry.slotIndexes[0])
    });
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingEntry) return;
    await mutateAction("edit-entry", async () => {
      const response = await fetch(`/api/timetable/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: editForm.dayOfWeek,
          slotStart: Number(editForm.slotStart),
          teacherId: editForm.teacherId,
          roomId: editForm.roomId,
          isLocked: true
        })
      });
      return { ok: response.ok, payload: await response.json() };
    });
    setEditingEntry(null);
  }

  // ─── Entry Card ────────────────────────────────────
  function renderEntryCard(entry: TimetableEntry, slotIndex: number) {
    const meta = getMeta(data, entry);
    const firstSlot = entry.slotIndexes[0] === slotIndex;
    const selected = selectedMoveEntryId === entry.id;
    const colors = subjectColorMap.get(entry.subjectId) || SUBJECT_COLORS[0];

    if (!firstSlot) {
      return (
        <div key={`${entry.id}-${slotIndex}`} className={cn("rounded-xl border px-3 py-2 text-xs", colors.bg, colors.border, colors.text, "opacity-60")}>
          ↕ continues
        </div>
      );
    }

    return (
      <div
        key={`${entry.id}-${slotIndex}`}
        className={cn(
          "group relative rounded-xl border px-3 py-2.5 text-sm transition-all cursor-pointer",
          selected
            ? "ring-2 ring-blue-400 ring-offset-1 shadow-lg"
            : cn(colors.bg, colors.border),
          !readOnly && "hover:shadow-md active:scale-[0.98]"
        )}
        draggable={!readOnly}
        onClick={() => openEditModal(entry)}
        onDragStart={(event) => {
          if (readOnly) return;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", entry.id);
          setDraggedEntryId(entry.id);
          setSelectedMoveEntryId(entry.id);
        }}
        onDragEnd={() => {
          setDraggedEntryId(null);
          setDropTarget(null);
        }}
      >
        {/* Color accent bar */}
        <div className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-full", colors.accent)} />

        <div className="pl-2.5">
          <div className="flex items-start justify-between gap-1">
            <p className={cn("font-semibold text-sm leading-tight", colors.text)}>{meta.subject}</p>
            {!readOnly && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="h-3 w-3 text-ink/40" />
                <Grip className="h-3 w-3 text-ink/30" />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-ink/50">{meta.teacher}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-ink/40">
            <span>{meta.room}</span>
            <span>•</span>
            <span>{meta.batch}</span>
          </div>

          {!readOnly && (
            <div className="mt-2 flex items-center gap-1.5">
              <button
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] uppercase tracking-wider transition",
                  selected
                    ? "border-blue-400 bg-blue-500 text-white"
                    : "border-ink/10 bg-white/80 text-ink/50 hover:border-blue-300 hover:text-blue-600"
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedMoveEntryId((current) => (current === entry.id ? null : entry.id));
                  setDraggedEntryId(null);
                  setDropTarget(null);
                }}
                type="button"
              >
                <Move className="h-2.5 w-2.5" />
                {selected ? "Active" : "Move"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Drop Zone ─────────────────────────────────────
  function renderDropZone(dayOfWeek: WeekDay, slotIndex: number, content: React.ReactNode) {
    const canDropHere = movableEntry ? entryCanStartAt(movableEntry, dayOfWeek, slotIndex) : false;
    const isTarget = dropTarget?.dayOfWeek === dayOfWeek && dropTarget.slotIndex === slotIndex;
    const interactive = !readOnly && Boolean(selectedMoveEntryId) && canDropHere;

    return (
      <div
        className={cn(
          "min-h-[4.5rem] space-y-2 rounded-xl p-1.5 transition-all",
          canDropHere && !readOnly && "border-2 border-dashed border-blue-200 bg-blue-50/30",
          isTarget && "border-blue-400 bg-blue-100/50 shadow-inner",
          interactive && "cursor-pointer hover:bg-blue-50/50"
        )}
        onClick={() => {
          if (interactive && selectedMoveEntryId) handleDropAttempt(dayOfWeek, slotIndex);
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          if (readOnly || !movableEntry || !canDropHere) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          if (dropTarget?.dayOfWeek !== dayOfWeek || dropTarget.slotIndex !== slotIndex) {
            setDropTarget({ dayOfWeek, slotIndex });
          }
        }}
        onDragLeave={() => { if (isTarget) setDropTarget(null); }}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          if (readOnly || !movableEntry || !canDropHere) return;
          event.preventDefault();
          handleDropAttempt(dayOfWeek, slotIndex);
        }}
      >
        {content}
        {!readOnly && selectedMoveEntryId && canDropHere && (
          <div className="rounded-lg border border-dashed border-blue-300 px-2 py-1.5 text-center text-[10px] uppercase tracking-widest text-blue-500 animate-pulse">
            Drop here
          </div>
        )}
      </div>
    );
  }

  // ─── WEEK VIEW (Desktop) ───────────────────────────
  function renderWeekGrid() {
    return (
      <div className="hidden lg:block overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header Row */}
            <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-ink/10 bg-gradient-to-r from-slate-50 to-white">
              <div className="px-3 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink/40">Time</div>
              {WEEK_DAYS.map((day) => (
                <div key={day} className="border-l border-ink/5 px-3 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{day.slice(0, 3)}</p>
                  <p className="mt-0.5 text-xs font-medium text-ink/70">{day}</p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {daySlots.map((slot, rowIdx) => (
              <div
                key={slot.slotIndex}
                className={cn(
                  "grid grid-cols-[80px_repeat(5,1fr)] border-b border-ink/5",
                  rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                )}
              >
                {/* Time Label */}
                <div className="flex flex-col justify-center px-3 py-3 border-r border-ink/5">
                  <p className="text-xs font-semibold text-ink/70">{slot.startTime}</p>
                  <p className="text-[10px] text-ink/35">{slot.endTime}</p>
                </div>

                {/* Day Columns */}
                {WEEK_DAYS.map((day) => {
                  const cellEntries = visibleEntries.filter(
                    (entry) => entry.dayOfWeek === day && entry.slotIndexes.includes(slot.slotIndex)
                  );

                  return (
                    <div key={`${day}-${slot.slotIndex}`} className="border-l border-ink/5 px-1.5 py-1.5">
                      {renderDropZone(
                        day,
                        slot.slotIndex,
                        cellEntries.length === 0 ? (
                          <div className="flex h-[4rem] items-center justify-center rounded-lg text-[10px] text-ink/20">
                            —
                          </div>
                        ) : (
                          cellEntries.map((entry) => renderEntryCard(entry, slot.slotIndex))
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── DAY VIEW (Mobile + Selectable) ────────────────
  function renderDayView(day: WeekDay) {
    return (
      <div className="space-y-1">
        {daySlots.map((slot) => {
          const cellEntries = visibleEntries.filter(
            (entry) => entry.dayOfWeek === day && entry.slotIndexes.includes(slot.slotIndex)
          );

          return (
            <div key={`${day}-${slot.slotIndex}`} className="flex gap-3 rounded-xl bg-white/60 p-2.5">
              {/* Time */}
              <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100/80 py-2">
                <p className="text-xs font-bold text-ink/70">{slot.startTime}</p>
                <p className="text-[9px] text-ink/35 mt-0.5">{slot.endTime}</p>
              </div>

              {/* Entries */}
              <div className="flex-1 min-w-0">
                {renderDropZone(
                  day,
                  slot.slotIndex,
                  cellEntries.length === 0 ? (
                    <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-ink/10 text-xs text-ink/25">
                      Free
                    </div>
                  ) : (
                    cellEntries.map((entry) => renderEntryCard(entry, slot.slotIndex))
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Toolbar ───────────────────────────────── */}
      <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink sm:text-xl">
              📅 Timetable
            </h1>
            <p className="mt-1 text-xs text-ink/50">
              {readOnly ? "View your schedule" : "Generate, edit, drag-and-drop to rearrange"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle */}
            <div className="inline-flex rounded-lg border border-ink/10 bg-slate-50/80 p-0.5">
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  viewMode === "week" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                )}
                onClick={() => setViewMode("week")}
                type="button"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Week</span>
              </button>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                  viewMode === "day" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                )}
                onClick={() => setViewMode("day")}
                type="button"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Day</span>
              </button>
            </div>

            {/* Batch filter */}
            <select
              className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs text-ink outline-none"
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
            >
              <option value="">All Batches</option>
              {data.batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.batchName}</option>
              ))}
            </select>

            {!readOnly && (
              <>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:border-accent hover:text-accent"
                  type="button"
                  onClick={() => setShowHolidayModal(true)}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Holiday & Leave
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white transition hover:bg-accent"
                  type="button"
                  onClick={() =>
                    mutateAction("generate", async () => {
                      const response = await fetch("/api/timetable/generate", { method: "POST" });
                      return { ok: response.ok, payload: await response.json() };
                    })
                  }
                >
                  <RefreshCcw className={cn("h-3.5 w-3.5", loading === "generate" && "animate-spin")} />
                  {loading === "generate" ? "..." : "New Timetable"}
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:border-accent hover:text-accent"
                  type="button"
                  onClick={() =>
                    mutateAction("validate", async () => {
                      const response = await fetch("/api/timetable/validate");
                      return { ok: response.ok, payload: await response.json() };
                    })
                  }
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Validate
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:border-accent hover:text-accent"
                  type="button"
                  onClick={() =>
                    mutateAction("publish", async () => {
                      const response = await fetch("/api/timetable/publish", { method: "POST" });
                      return { ok: response.ok, payload: await response.json() };
                    })
                  }
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Publish
                </button>
              </>
            )}

            <a className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:border-accent hover:text-accent" href="/api/exports/excel" target="_blank">
              <Download className="h-3.5 w-3.5" /> Excel
            </a>
            <a className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:border-accent hover:text-accent" href="/api/exports/pdf" target="_blank">
              <Download className="h-3.5 w-3.5" /> PDF
            </a>

            <button className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-xs font-medium text-ink transition hover:border-accent hover:text-accent" type="button" onClick={refreshData}>
              Refresh
            </button>
          </div>
        </div>

        {/* More action buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-[11px] font-medium text-ink transition hover:border-accent hover:text-accent"
            type="button"
            onClick={() =>
              mutateAction("quality", async () => {
                const response = await fetch("/api/ai/summarize-quality");
                return { ok: response.ok, payload: await response.json() };
              })
            }
          >
            <Sparkles className="h-3 w-3" /> AI Quality
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-[11px] font-medium text-ink transition hover:border-accent hover:text-accent"
            type="button"
            onClick={() =>
              mutateAction("resolve", async () => {
                const response = await fetch("/api/conflicts/resolve", { method: "POST" });
                return { ok: response.ok, payload: await response.json() };
              })
            }
          >
            <WandSparkles className="h-3 w-3" /> Resolve
          </button>
          {!readOnly && selectedMoveEntryId && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedMoveEntryId(null);
                setDraggedEntryId(null);
                setDropTarget(null);
                setNote("Move cancelled.");
              }}
              type="button"
            >
              <X className="h-3 w-3" /> Cancel Move
            </button>
          )}
        </div>

        {note && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink/60">{note}</p>}
      </section>

      {/* ─── Calendar Grid ─────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          {/* Day navigator (for day view + mobile) */}
          {(viewMode === "day" || true) && (
            <div className="mb-4 lg:hidden">
              <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-2 shadow-sm">
                <button
                  className="rounded-lg p-2 hover:bg-slate-100 transition"
                  onClick={() => setActiveDayIndex((i) => (i > 0 ? i - 1 : WEEK_DAYS.length - 1))}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1">
                  {WEEK_DAYS.map((day, idx) => (
                    <button
                      key={day}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                        idx === activeDayIndex
                          ? "bg-ink text-white"
                          : "text-ink/50 hover:bg-slate-100"
                      )}
                      onClick={() => setActiveDayIndex(idx)}
                      type="button"
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <button
                  className="rounded-lg p-2 hover:bg-slate-100 transition"
                  onClick={() => setActiveDayIndex((i) => (i < WEEK_DAYS.length - 1 ? i + 1 : 0))}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile: always day view */}
          <div className="lg:hidden">
            <div className="rounded-2xl border border-ink/10 bg-slate-50/50 p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">{activeDay}</h2>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                  {visibleEntries.filter((e) => e.dayOfWeek === activeDay).length} classes
                </span>
              </div>
              {renderDayView(activeDay)}
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block">
            {viewMode === "week" ? (
              renderWeekGrid()
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-slate-50/50 p-4 shadow-sm">
                {/* Day picker for desktop day view */}
                <div className="mb-4 flex items-center gap-2">
                  {WEEK_DAYS.map((day, idx) => (
                    <button
                      key={day}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-xs font-semibold transition",
                        idx === activeDayIndex
                          ? "bg-ink text-white shadow-md"
                          : "bg-white text-ink/50 border border-ink/10 hover:border-accent hover:text-accent"
                      )}
                      onClick={() => setActiveDayIndex(idx)}
                      type="button"
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {renderDayView(activeDay)}
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar ────────────────────────────── */}
        <div className="space-y-5">


          {/* Conflicts */}
          <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-ink">Conflicts</h2>
              <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{conflicts.length}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conflicts.map((conflict) => (
                <div key={`${conflict.type}-${conflict.entryIds.join("-")}`} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <p className="text-xs font-medium text-red-700">{conflict.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-red-400">{conflict.type.replaceAll("_", " ")}</p>
                </div>
              ))}
              {conflicts.length === 0 && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600">
                  ✓ No conflicts detected. Run Validate to check.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ─── Edit Modal ─────────────────────────────── */}
      {editingEntry && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setEditingEntry(null)}>
          <form
            className="w-full max-w-md rounded-2xl border border-white/10 bg-forest p-5 text-white shadow-2xl sm:rounded-2xl"
            onSubmit={handleEditSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-accent">Edit Entry</p>
                <h2 className="mt-1 text-lg font-bold">
                  {getMeta(data, editingEntry).subject}
                </h2>
              </div>
              <button type="button" onClick={() => setEditingEntry(null)} className="rounded-lg p-2 hover:bg-white/10 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Day</span>
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-accent" value={editForm.dayOfWeek} onChange={(e) => setEditForm((c) => ({ ...c, dayOfWeek: e.target.value }))}>
                  {WEEK_DAYS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Starting Slot</span>
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-accent" value={editForm.slotStart} onChange={(e) => setEditForm((c) => ({ ...c, slotStart: e.target.value }))}>
                  {daySlots.map((s) => (<option key={s.slotIndex} value={s.slotIndex}>{s.startTime} - {s.endTime}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Teacher</span>
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-accent" value={editForm.teacherId} onChange={(e) => setEditForm((c) => ({ ...c, teacherId: e.target.value }))}>
                  {data.teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Room</span>
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-accent" value={editForm.roomId} onChange={(e) => setEditForm((c) => ({ ...c, roomId: e.target.value }))}>
                  {data.rooms.map((r) => (<option key={r.id} value={r.id}>{r.roomName}</option>))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-white hover:text-ink" type="submit" disabled={loading === "edit-entry"}>
                {loading === "edit-entry" ? "Saving..." : "Save Changes"}
              </button>
              <button className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/60 transition hover:text-white" type="button" onClick={() => setEditingEntry(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Holiday & Leave Modal ────────────────── */}
      {showHolidayModal && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4" onClick={() => setShowHolidayModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-forest p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">Holiday & Leave</h2>
                <p className="mt-1 text-[10px] text-white/60">Manage faculty absence and custom holidays</p>
              </div>
              <button type="button" onClick={() => setShowHolidayModal(false)} className="rounded-lg p-2 hover:bg-white/10 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await mutateAction("holiday", async () => {
                  const response = await fetch("/api/holidays", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...holidayForm, fullDay: true })
                  });
                  return { ok: response.ok, payload: await response.json() };
                });
                setHolidayForm({ holidayDate: "", holidayName: "" });
              }}
            >
              <p className="text-[10px] uppercase tracking-widest text-white/40">Add Holiday</p>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Holiday Name</span>
                <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-accent" placeholder="E.g. Diwali break" required value={holidayForm.holidayName} onChange={(e) => setHolidayForm((c) => ({ ...c, holidayName: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Date</span>
                <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-accent" type="date" required value={holidayForm.holidayDate} onChange={(e) => setHolidayForm((c) => ({ ...c, holidayDate: e.target.value }))} />
              </label>
              <button className="w-full rounded-lg bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-white hover:text-ink mt-2" type="submit">
                Save Holiday
              </button>
            </form>

            <form
              className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await mutateAction("leave", async () => {
                  const response = await fetch("/api/leaves", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(leaveForm)
                  });
                  return { ok: response.ok, payload: await response.json() };
                });
                setLeaveForm((c) => ({ ...c, leaveDate: "", reason: "" }));
              }}
            >
              <p className="text-[10px] uppercase tracking-widest text-white/40">Record Faculty Leave</p>
              <label className="block">
                 <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Teacher</span>
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-accent" value={leaveForm.teacherId} onChange={(e) => setLeaveForm((c) => ({ ...c, teacherId: e.target.value }))}>
                  {data.teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Leave Date</span>
                  <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-accent" type="date" required value={leaveForm.leaveDate} onChange={(e) => setLeaveForm((c) => ({ ...c, leaveDate: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Reason</span>
                  <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-accent" placeholder="Not well" required value={leaveForm.reason} onChange={(e) => setLeaveForm((c) => ({ ...c, reason: e.target.value }))} />
                </label>
              </div>
              <button className="w-full rounded-lg bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-white hover:text-ink mt-2" type="submit">
                Save Leave
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
