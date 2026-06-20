"use client";

import { fromZonedTime } from "date-fns-tz";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const weekdays = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота"];

type WorkingHours = { id: string; weekday: number; startTime: string; endTime: string; isWorkingDay: boolean };
type ScheduleBlock = { id: string; startAt: Date; endAt: Date; reason: string | null };

export function ScheduleEditor({ workingHours, scheduleBlocks }: { workingHours: WorkingHours[]; scheduleBlocks: ScheduleBlock[] }) {
  const router = useRouter();
  const [hours, setHours] = useState(workingHours);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState("");

  async function saveHours(row: WorkingHours) {
    setSavingId(row.id);
    try {
      const response = await fetch("/api/admin/schedule", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "working-hours", ...row }) });
      if (!response.ok) throw new Error();
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function createBlock(formData: FormData) {
    const date = String(formData.get("date"));
    const startTime = String(formData.get("startTime"));
    const endTime = String(formData.get("endTime"));
    setBlockStatus("");
    const response = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "schedule-block",
        startAt: fromZonedTime(`${date}T${startTime}:00`, "Europe/Kyiv").toISOString(),
        endAt: fromZonedTime(`${date}T${endTime}:00`, "Europe/Kyiv").toISOString(),
        reason: String(formData.get("reason") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setBlockStatus(body.message ?? "Не вдалося створити блокування.");
      return;
    }
    setBlockStatus("Блокування додано.");
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
      <section className="border border-line bg-surface">
        <div className="border-b border-line px-5 py-4"><h2 className="font-bold">Робочі години</h2><p className="mt-1 text-xs text-muted">Час студії: Europe/Kyiv</p></div>
        <div className="divide-y divide-line">{hours.map((row) => <div key={row.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[8rem_1fr_1fr_auto_auto] sm:items-center"><span className="font-bold">{weekdays[row.weekday]}</span><input className="field" type="time" value={row.startTime} disabled={!row.isWorkingDay} onChange={(event) => setHours((items) => items.map((item) => item.id === row.id ? { ...item, startTime: event.target.value } : item))} /><input className="field" type="time" value={row.endTime} disabled={!row.isWorkingDay} onChange={(event) => setHours((items) => items.map((item) => item.id === row.id ? { ...item, endTime: event.target.value } : item))} /><label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={row.isWorkingDay} onChange={(event) => setHours((items) => items.map((item) => item.id === row.id ? { ...item, isWorkingDay: event.target.checked } : item))} />Робочий</label><button type="button" className="text-sm font-bold text-accent disabled:text-muted" disabled={savingId === row.id} onClick={() => saveHours(row)}>{savingId === row.id ? "…" : "Зберегти"}</button></div>)}</div>
      </section>
      <section className="border border-line bg-surface p-5">
        <h2 className="font-bold">Заблокувати час</h2>
        <form action={createBlock} className="mt-5 grid gap-4">
          <label><span className="field-label">Дата</span><input className="field" type="date" name="date" required /></label>
          <div className="grid grid-cols-2 gap-3"><label><span className="field-label">Початок</span><input className="field" type="time" name="startTime" required /></label><label><span className="field-label">Кінець</span><input className="field" type="time" name="endTime" required /></label></div>
          <label><span className="field-label">Причина (необов’язково)</span><input className="field" name="reason" /></label>
          <button className="button-primary w-full" type="submit"><Plus size={16} /> Додати блокування</button>
          {blockStatus ? <p className="text-sm text-muted" role="status">{blockStatus}</p> : null}
        </form>
        <div className="mt-8 border-t border-line pt-5"><h3 className="text-sm font-bold">Майбутні блокування</h3><div className="mt-3 space-y-3">{scheduleBlocks.length ? scheduleBlocks.map((block) => <div key={block.id} className="border-l-2 border-accent pl-3 text-sm"><strong className="block">{block.startAt.toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Kyiv" })}</strong><span className="text-muted">{block.reason ?? "Без причини"}</span></div>) : <p className="text-sm text-muted">Майбутніх блокувань немає.</p>}</div></div>
      </section>
    </div>
  );
}
