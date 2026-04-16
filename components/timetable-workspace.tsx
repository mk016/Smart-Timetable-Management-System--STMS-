"use client";

import { DragEvent, ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  Grip,
  Move,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AppData, Conflict, TimetableEntry, WEEK_DAYS, WeekDay } from "@/lib/types";

type DropTarget = {
  dayOfWeek: WeekDay;
  slotIndex: number;
};

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
  const [selectedMoveEntryId, setSelectedMoveEntryId] = useState<string | null>(null);
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    holidayDate: "",
    holidayName: ""
  });
  const [leaveForm, setLeaveForm] = useState({
    teacherId: initialData.teachers[0]?.id || "",
    leaveDate: "",
    reason: ""
  });

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
    if (!batchFilter) {
      return data.timetableEntries;
    }
    return data.timetableEntries.filter((entry) => entry.batchId === batchFilter);
  }, [batchFilter, data.timetableEntries]);

  const movableEntryId = draggedEntryId || selectedMoveEntryId;
  const movableEntry = data.timetableEntries.find((entry) => entry.id === movableEntryId) || null;

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
      if (nextData) {
        setData(nextData);
      }
      const nextConflicts = result.payload.conflicts as Conflict[] | undefined;
      setConflicts(nextConflicts ?? []);
      setNote(String(result.payload.message || "Action completed."));
    } else {
      const nextConflicts = result.payload.conflicts as Conflict[] | undefined;
      if (nextConflicts) {
        setConflicts(nextConflicts);
      }
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dayOfWeek,
          slotStart,
          isLocked: true
        })
      });
      return { ok: response.ok, payload: await response.json() };
    });

    setSelectedMoveEntryId(null);
    setDraggedEntryId(null);
    setDropTarget(null);
  }

  function handleDropAttempt(dayOfWeek: WeekDay, slotIndex: number) {
    if (!movableEntry || !entryCanStartAt(movableEntry, dayOfWeek, slotIndex)) {
      return;
    }
    void moveEntry(movableEntry.id, dayOfWeek, slotIndex);
  }

  function renderEntryCard(entry: TimetableEntry, slotIndex: number, compact = false) {
    const meta = getMeta(data, entry);
    const firstSlot = entry.slotIndexes[0] === slotIndex;
    const selected = selectedMoveEntryId === entry.id;

    if (!firstSlot) {
      return (
        <div
          key={`${entry.id}-${slotIndex}`}
          className="rounded-2xl border border-ink/10 bg-white px-3 py-3 text-xs uppercase tracking-[0.2em] text-ink/55"
        >
          Continues
        </div>
      );
    }

    return (
      <div
        key={`${entry.id}-${slotIndex}`}
        className={cn(
          "rounded-2xl border px-3 py-3 text-sm transition",
          selected
            ? "border-accent bg-accent/15 shadow-[0_12px_30px_-20px_rgba(75,163,227,0.8)]"
            : "border-accent/25 bg-accent/10 text-ink",
          !readOnly && "cursor-grab active:cursor-grabbing"
        )}
        draggable={!readOnly}
        onDragStart={(event) => {
          if (readOnly) {
            return;
          }
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", entry.id);
          setDraggedEntryId(entry.id);
          setSelectedMoveEntryId(entry.id);
          setNote(`Dragging ${meta.subject}. Drop it on a target slot.`);
        }}
        onDragEnd={() => {
          setDraggedEntryId(null);
          setDropTarget(null);
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{meta.subject}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/45">{meta.batch}</p>
          </div>
          {!readOnly ? <Grip className="mt-0.5 h-4 w-4 shrink-0 text-ink/35" /> : null}
        </div>
        <p className="mt-2 text-xs text-ink/55">{meta.teacher}</p>
        <p className="mt-1 text-xs text-ink/45">
          {meta.room} • Slots {entry.slotIndexes.join(", ")}
        </p>

        {!readOnly ? (
          <div className={cn("mt-3 flex flex-wrap items-center gap-2", compact && "gap-1")}>
            <button
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition",
                selected
                  ? "border-accent bg-accent text-white"
                  : "border-ink/15 bg-white/70 text-ink hover:border-accent hover:text-accent"
              )}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedMoveEntryId((current) => (current === entry.id ? null : entry.id));
                setDraggedEntryId(null);
                setDropTarget(null);
                setNote(
                  selected
                    ? "Move mode cleared."
                    : `Move mode active for ${meta.subject}. Desktop par drag karo, mobile par target slot tap karo.`
                );
              }}
              type="button"
            >
              <Move className="h-3 w-3" />
              {selected ? "Selected" : "Move"}
            </button>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
              Drag on desktop
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  function renderDropZone(dayOfWeek: WeekDay, slotIndex: number, content: ReactNode) {
    const canDropHere = movableEntry ? entryCanStartAt(movableEntry, dayOfWeek, slotIndex) : false;
    const isTarget = dropTarget?.dayOfWeek === dayOfWeek && dropTarget.slotIndex === slotIndex;
    const interactive = !readOnly && Boolean(selectedMoveEntryId) && canDropHere;

    return (
      <div
        className={cn(
          "min-h-28 space-y-3 rounded-3xl bg-canvas/60 p-3 transition",
          canDropHere && !readOnly && "border border-dashed border-accent/20",
          isTarget && "border border-accent bg-accent/10 shadow-[0_12px_30px_-20px_rgba(75,163,227,0.7)]",
          interactive && "cursor-pointer hover:bg-accent/5"
        )}
        onClick={() => {
          if (interactive && selectedMoveEntryId) {
            handleDropAttempt(dayOfWeek, slotIndex);
          }
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          if (readOnly || !movableEntry || !canDropHere) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          if (dropTarget?.dayOfWeek !== dayOfWeek || dropTarget.slotIndex !== slotIndex) {
            setDropTarget({ dayOfWeek, slotIndex });
          }
        }}
        onDragLeave={() => {
          if (isTarget) {
            setDropTarget(null);
          }
        }}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          if (readOnly || !movableEntry || !canDropHere) {
            return;
          }
          event.preventDefault();
          handleDropAttempt(dayOfWeek, slotIndex);
        }}
      >
        {content}
        {!readOnly && selectedMoveEntryId && canDropHere ? (
          <div className="rounded-2xl border border-dashed border-accent/30 px-3 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-accent">
            Tap or drop here
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)] sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Scheduler Workspace</p>
            <h1 className="mt-3 font-serif text-3xl uppercase tracking-tight text-ink sm:text-4xl">
              Timetable Board
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/60">
              Generator, validator, export, holiday/leave control aur AI assistant sab ek jagah ready hain.
            </p>
            {!readOnly ? (
              <p className="mt-3 text-xs leading-6 text-ink/50">
                Drag first class block to a new slot on desktop. Mobile par `Move` दबाकर target slot tap kar sakte ho.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {!readOnly ? (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-accent"
                  type="button"
                  onClick={() =>
                    mutateAction("generate", async () => {
                      const response = await fetch("/api/timetable/generate", { method: "POST" });
                      return { ok: response.ok, payload: await response.json() };
                    })
                  }
                >
                  <RefreshCcw className="h-4 w-4" />
                  {loading === "generate" ? "Generating..." : "Generate"}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
                  type="button"
                  onClick={() =>
                    mutateAction("validate", async () => {
                      const response = await fetch("/api/timetable/validate");
                      return { ok: response.ok, payload: await response.json() };
                    })
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  Validate
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
                  type="button"
                  onClick={() =>
                    mutateAction("publish", async () => {
                      const response = await fetch("/api/timetable/publish", { method: "POST" });
                      return { ok: response.ok, payload: await response.json() };
                    })
                  }
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Publish
                </button>
              </>
            ) : null}
            <a
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
              href="/api/exports/excel"
              target="_blank"
            >
              <Download className="h-4 w-4" />
              Excel
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
              href="/api/exports/pdf"
              target="_blank"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            className="rounded-full border border-ink/15 bg-transparent px-4 py-3 text-sm text-ink outline-none"
            value={batchFilter}
            onChange={(event) => setBatchFilter(event.target.value)}
          >
            <option value="">All Visible</option>
            {data.batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batchName}
              </option>
            ))}
          </select>
          <button
            className="rounded-full border border-ink/15 px-4 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
            type="button"
            onClick={() =>
              mutateAction("quality", async () => {
                const response = await fetch("/api/ai/summarize-quality");
                return { ok: response.ok, payload: await response.json() };
              })
            }
          >
            <Sparkles className="mr-2 inline h-4 w-4" />
            AI Quality
          </button>
          <button
            className="rounded-full border border-ink/15 px-4 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
            type="button"
            onClick={() =>
              mutateAction("resolve", async () => {
                const response = await fetch("/api/conflicts/resolve", { method: "POST" });
                return { ok: response.ok, payload: await response.json() };
              })
            }
          >
            <WandSparkles className="mr-2 inline h-4 w-4" />
            Resolve Preview
          </button>
          <button
            className="rounded-full border border-ink/15 px-4 py-3 text-xs uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent"
            type="button"
            onClick={refreshData}
          >
            Refresh
          </button>
          {!readOnly && selectedMoveEntryId ? (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-3 text-xs uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-50"
              onClick={() => {
                setSelectedMoveEntryId(null);
                setDraggedEntryId(null);
                setDropTarget(null);
                setNote("Move mode cleared.");
              }}
              type="button"
            >
              <X className="h-4 w-4" />
              Clear Move
            </button>
          ) : null}
        </div>

        {note ? <p className="mt-4 text-sm text-ink/70">{note}</p> : null}
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="lg:hidden space-y-4">
            {WEEK_DAYS.map((day) => (
              <section
                key={day}
                className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white p-4 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)]"
              >
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink/10 pb-4">
                  <h2 className="font-serif text-2xl uppercase tracking-tight text-ink">{day}</h2>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
                    Day View
                  </span>
                </div>
                <div className="space-y-3">
                  {daySlots.map((slot) => {
                    const cellEntries = visibleEntries.filter(
                      (entry) => entry.dayOfWeek === day && entry.slotIndexes.includes(slot.slotIndex)
                    );

                    return (
                      <div key={`${day}-${slot.slotIndex}`} className="rounded-3xl bg-canvas/50 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-ink">{slot.startTime}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">{slot.endTime}</p>
                          </div>
                          {movableEntry && entryCanStartAt(movableEntry, day, slot.slotIndex) ? (
                            <span className="rounded-full border border-accent/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
                              Drop Zone
                            </span>
                          ) : null}
                        </div>
                        {renderDropZone(
                          day,
                          slot.slotIndex,
                          cellEntries.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-ink/10 px-3 py-5 text-center text-xs uppercase tracking-[0.2em] text-ink/30">
                              Free Slot
                            </div>
                          ) : (
                            cellEntries.map((entry) => renderEntryCard(entry, slot.slotIndex, true))
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)] lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] border-collapse xl:min-w-full">
                <thead>
                  <tr className="bg-forest text-left text-xs uppercase tracking-[0.2em] text-white/60">
                    <th className="sticky left-0 min-w-36 bg-forest px-4 py-4">Time</th>
                    {WEEK_DAYS.map((day) => (
                      <th key={day} className="min-w-56 px-4 py-4">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daySlots.map((slot) => (
                    <tr key={slot.slotIndex} className="border-t border-ink/10 align-top">
                      <td className="sticky left-0 z-10 bg-canvas/95 px-4 py-4 text-sm text-ink/70 backdrop-blur">
                        <p className="font-medium text-ink">{slot.startTime}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{slot.endTime}</p>
                      </td>
                      {WEEK_DAYS.map((day) => {
                        const cellEntries = visibleEntries.filter(
                          (entry) => entry.dayOfWeek === day && entry.slotIndexes.includes(slot.slotIndex)
                        );

                        return (
                          <td key={`${day}-${slot.slotIndex}`} className="px-3 py-3">
                            {renderDropZone(
                              day,
                              slot.slotIndex,
                              cellEntries.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-ink/10 px-3 py-6 text-center text-xs uppercase tracking-[0.2em] text-ink/30">
                                  Free Slot
                                </div>
                              ) : (
                                cellEntries.map((entry) => renderEntryCard(entry, slot.slotIndex))
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {!readOnly ? (
            <section className="rounded-[2rem] border border-white/10 bg-forest p-5 text-white shadow-halo sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Calendar Operations</p>
              <h2 className="mt-3 font-serif text-2xl uppercase tracking-tight sm:text-3xl">
                Holiday & Leave
              </h2>

              <div className="mt-6 space-y-6">
                <form
                  className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4"
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
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Add Holiday</p>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    placeholder="Holiday name"
                    value={holidayForm.holidayName}
                    onChange={(event) =>
                      setHolidayForm((current) => ({ ...current, holidayName: event.target.value }))
                    }
                  />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    type="date"
                    value={holidayForm.holidayDate}
                    onChange={(event) =>
                      setHolidayForm((current) => ({ ...current, holidayDate: event.target.value }))
                    }
                  />
                  <button className="rounded-full bg-accent px-4 py-3 text-xs uppercase tracking-[0.2em]" type="submit">
                    Save Holiday
                  </button>
                </form>

                <form
                  className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4"
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
                    setLeaveForm((current) => ({ ...current, leaveDate: "", reason: "" }));
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Record Leave</p>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    value={leaveForm.teacherId}
                    onChange={(event) =>
                      setLeaveForm((current) => ({ ...current, teacherId: event.target.value }))
                    }
                  >
                    {data.teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    type="date"
                    value={leaveForm.leaveDate}
                    onChange={(event) =>
                      setLeaveForm((current) => ({ ...current, leaveDate: event.target.value }))
                    }
                  />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    placeholder="Reason"
                    value={leaveForm.reason}
                    onChange={(event) =>
                      setLeaveForm((current) => ({ ...current, reason: event.target.value }))
                    }
                  />
                  <button className="rounded-full bg-accent px-4 py-3 text-xs uppercase tracking-[0.2em]" type="submit">
                    Save Leave
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)] sm:p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">Conflict Feed</p>
                <h2 className="font-serif text-2xl uppercase tracking-tight text-ink sm:text-3xl">
                  Validation Output
                </h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {conflicts.map((conflict) => (
                <div
                  key={`${conflict.type}-${conflict.entryIds.join("-")}`}
                  className="rounded-3xl border border-red-100 bg-red-50 p-4"
                >
                  <p className="text-sm font-medium text-red-700">{conflict.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-red-500">
                    {conflict.type.replaceAll("_", " ")}
                  </p>
                </div>
              ))}
              {conflicts.length === 0 ? (
                <div className="rounded-3xl border border-ink/10 bg-canvas/50 p-4 text-sm text-ink/55">
                  Abhi tak validation run ka result yahan dikhai dega. Generate ke baad Validate dabao.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
