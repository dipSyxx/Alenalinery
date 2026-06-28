"use client";

import { fromZonedTime } from "date-fns-tz";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const weekdays = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота"];

type WorkingHours = { id: string; weekday: number; startTime: string; endTime: string; isWorkingDay: boolean };
type ScheduleBlock = { id: string; startAt: Date; endAt: Date; reason: string | null };

export function ScheduleEditor({ workingHours, scheduleBlocks }: { workingHours: WorkingHours[]; scheduleBlocks: ScheduleBlock[] }) {
  const router = useRouter();
  const [hours, setHours] = useState(workingHours);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteBlock(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Блокування видалено.");
      router.refresh();
    } catch {
      toast.error("Не вдалося видалити блокування.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function saveHours(row: WorkingHours) {
    setSavingId(row.id);
    try {
      const response = await fetch("/api/admin/schedule", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "working-hours", ...row }) });
      if (!response.ok) throw new Error();
      toast.success(`Збережено: ${weekdays[row.weekday]}`);
      router.refresh();
    } catch {
      toast.error("Не вдалося зберегти робочі години.");
    } finally {
      setSavingId(null);
    }
  }

  async function createBlock(formData: FormData) {
    const date = String(formData.get("date"));
    const startTime = String(formData.get("startTime"));
    const endTime = String(formData.get("endTime"));
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
      toast.error(body.message ?? "Не вдалося створити блокування.");
      return;
    }
    toast.success("Блокування додано.");
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
      <Card className="admin-panel">
        <CardHeader className="border-b border-studio-border">
          <CardTitle>Робочі години</CardTitle>
          <CardDescription>Час студії: Europe/Kyiv</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-studio-border">
            {hours.map((row) => (
              <div key={row.id} className="grid items-center gap-3 px-(--card-spacing) py-3 sm:grid-cols-[8rem_1fr_1fr_auto_auto]">
                <span className="font-medium">{weekdays[row.weekday]}</span>
                <Input
                  type="time"
                  aria-label={`Початок — ${weekdays[row.weekday]}`}
                  value={row.startTime}
                  disabled={!row.isWorkingDay}
                  onChange={(event) => setHours((items) => items.map((item) => (item.id === row.id ? { ...item, startTime: event.target.value } : item)))}
                />
                <Input
                  type="time"
                  aria-label={`Кінець — ${weekdays[row.weekday]}`}
                  value={row.endTime}
                  disabled={!row.isWorkingDay}
                  onChange={(event) => setHours((items) => items.map((item) => (item.id === row.id ? { ...item, endTime: event.target.value } : item)))}
                />
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="size-4 accent-studio-accent"
                    checked={row.isWorkingDay}
                    onChange={(event) => setHours((items) => items.map((item) => (item.id === row.id ? { ...item, isWorkingDay: event.target.checked } : item)))}
                  />
                  Робочий
                </label>
                <Button variant="ghost" size="sm" disabled={savingId === row.id} onClick={() => saveHours(row)}>
                  {savingId === row.id ? "…" : "Зберегти"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="admin-panel">
        <CardHeader>
          <CardTitle>Заблокувати час</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBlock} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="block-date">Дата</Label>
              <Input id="block-date" className="h-11" type="date" name="date" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="block-start">Початок</Label>
                <Input id="block-start" className="h-11" type="time" name="startTime" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="block-end">Кінець</Label>
                <Input id="block-end" className="h-11" type="time" name="endTime" required />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="block-reason">Причина (необов’язково)</Label>
              <Input id="block-reason" className="h-11" name="reason" />
            </div>
            <Button type="submit" className="h-11 w-full">
              <Plus className="size-4" /> Додати блокування
            </Button>
          </form>
          <Separator className="my-6" />
          <h3 className="text-sm font-bold">Майбутні блокування</h3>
          <div className="mt-3 space-y-3">
            {scheduleBlocks.length ? (
              scheduleBlocks.map((block) => (
                <div key={block.id} className="flex items-start justify-between gap-2">
                  <div className="border-l-2 border-studio-accent pl-3 text-sm">
                    <strong className="block">{block.startAt.toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Kyiv" })}</strong>
                    <span className="text-studio-muted">{block.reason ?? "Без причини"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-studio-danger hover:bg-studio-danger/10 hover:text-studio-danger"
                    aria-label="Видалити блокування"
                    onClick={() => setConfirmDeleteId(block.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-studio-muted">Майбутніх блокувань немає.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити блокування?</DialogTitle>
            <DialogDescription>
              Цей час стане доступним для нових записів. Дію не можна скасувати.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Відмінити
            </Button>
            <Button
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => { if (confirmDeleteId) void deleteBlock(confirmDeleteId); }}
            >
              {deletingId ? "Видалення…" : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
