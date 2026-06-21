import { ScheduleEditor } from "@/components/schedule-editor";
import { getFutureScheduleBlocks, getWorkingHours } from "@/lib/data/supabase";

export default async function AdminSchedulePage() {
  const [workingHours, scheduleBlocks] = await Promise.all([
    getWorkingHours(),
    getFutureScheduleBlocks(),
  ]);

  return (
    <>
      <p className="eyebrow">Графік</p>
      <h1 className="display mt-2 text-5xl">Робочий час і блокування</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Ці налаштування безпосередньо впливають на публічно доступні слоти запису.</p>
      <ScheduleEditor workingHours={workingHours} scheduleBlocks={scheduleBlocks} />
    </>
  );
}
