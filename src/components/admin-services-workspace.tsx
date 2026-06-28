"use client";

import { Eye, EyeOff, Pencil, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type AdminService = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePriceUah: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  requiresConsultation: boolean;
  requiresDeposit: boolean;
  depositAmountUah: number | null;
  isActive: boolean;
  sortOrder: number;
};

type AdminServiceCategory = {
  id: string;
  name: string;
  isActive: boolean;
  services: AdminService[];
};

type ServiceFormState = {
  categoryId: string;
  name: string;
  description: string;
  basePriceUah: string;
  durationMinutes: string;
  bufferBeforeMinutes: string;
  bufferAfterMinutes: string;
  requiresConsultation: boolean;
  requiresDeposit: boolean;
  depositAmountUah: string;
  isActive: boolean;
  sortOrder: string;
};

type EditorState =
  | { mode: "closed"; service: null }
  | { mode: "create"; service: null }
  | { mode: "edit"; service: AdminService };

const emptyEditor: EditorState = { mode: "closed", service: null };

function createInitialForm(categoryId: string): ServiceFormState {
  return {
    categoryId,
    name: "",
    description: "",
    basePriceUah: "",
    durationMinutes: "60",
    bufferBeforeMinutes: "0",
    bufferAfterMinutes: "0",
    requiresConsultation: false,
    requiresDeposit: false,
    depositAmountUah: "",
    isActive: true,
    sortOrder: "0",
  };
}

function serviceToForm(service: AdminService): ServiceFormState {
  return {
    categoryId: service.categoryId,
    name: service.name,
    description: service.description,
    basePriceUah: String(service.basePriceUah),
    durationMinutes: String(service.durationMinutes),
    bufferBeforeMinutes: String(service.bufferBeforeMinutes),
    bufferAfterMinutes: String(service.bufferAfterMinutes),
    requiresConsultation: service.requiresConsultation,
    requiresDeposit: service.requiresDeposit,
    depositAmountUah: service.depositAmountUah === null ? "" : String(service.depositAmountUah),
    isActive: service.isActive,
    sortOrder: String(service.sortOrder),
  };
}

function toNumber(value: string, fallback = 0) {
  if (value.trim() === "") return fallback;
  return Number(value);
}

export function AdminServicesWorkspace({ categories }: { categories: AdminServiceCategory[] }) {
  const router = useRouter();
  const firstCategoryId = categories[0]?.id ?? "";
  const [activeCategoryId, setActiveCategoryId] = useState(firstCategoryId);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [form, setForm] = useState<ServiceFormState>(() => createInitialForm(firstCategoryId));
  const [saving, setSaving] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const selectOpenRef = useRef(false);

  const selectedCategoryId = activeCategoryId || firstCategoryId;
  const serviceCount = categories.reduce((total, category) => total + category.services.length, 0);
  const activeServiceCount = categories.reduce(
    (total, category) => total + category.services.filter((service) => service.isActive).length,
    0,
  );

  function updateForm<Value extends keyof ServiceFormState>(key: Value, value: ServiceFormState[Value]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setCategorySelectOpen(open: boolean) {
    selectOpenRef.current = open;
    setSelectOpen(open);
  }

  function openCreate() {
    const categoryId = selectedCategoryId || firstCategoryId;
    setForm(createInitialForm(categoryId));
    setEditor({ mode: "create", service: null });
  }

  function openEdit(service: AdminService) {
    setForm(serviceToForm(service));
    setEditor({ mode: "edit", service });
  }

  function closeEditor({ force = false }: { force?: boolean } = {}) {
    if (saving && !force) return;
    setEditor(emptyEditor);
    setCategorySelectOpen(false);
  }

  async function submitService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.categoryId) return;

    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      basePriceUah: toNumber(form.basePriceUah),
      durationMinutes: toNumber(form.durationMinutes, 60),
      bufferBeforeMinutes: toNumber(form.bufferBeforeMinutes),
      bufferAfterMinutes: toNumber(form.bufferAfterMinutes),
      requiresConsultation: form.requiresConsultation,
      requiresDeposit: form.requiresDeposit,
      depositAmountUah: form.requiresDeposit ? toNumber(form.depositAmountUah) : null,
      isActive: form.isActive,
      sortOrder: toNumber(form.sortOrder),
    };

    const endpoint = editor.mode === "edit" ? `/api/admin/services/${editor.service.id}` : "/api/admin/services";
    const method = editor.mode === "edit" ? "PATCH" : "POST";

    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(body.message ?? "Не вдалося зберегти послугу.");
      }

      toast.success(editor.mode === "edit" ? "Послугу оновлено." : "Послугу створено.");
      setActiveCategoryId(form.categoryId);
      closeEditor({ force: true });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не вдалося зберегти послугу.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div className="border border-studio-border bg-studio-surface p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-studio-muted">Усього</p>
            <strong className="mt-1 block text-2xl">{serviceCount}</strong>
          </div>
          <div className="border border-studio-border bg-studio-surface p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-studio-muted">Активні</p>
            <strong className="mt-1 block text-2xl">{activeServiceCount}</strong>
          </div>
        </div>
        <Button className="h-11 w-full sm:w-auto" onClick={openCreate} disabled={!categories.length}>
          <Plus className="size-4" /> Додати послугу
        </Button>
      </div>

      {categories.length ? (
        <Tabs value={selectedCategoryId} onValueChange={setActiveCategoryId} className="mt-6">
          <div className="-mx-5 -mt-1 overflow-x-auto px-5 pb-1 pt-1 sm:mx-0 sm:px-0">
            <TabsList className="h-auto min-w-max justify-start gap-1 rounded-none bg-transparent p-0">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="h-9 flex-none snap-start gap-2 border-studio-border bg-studio-surface px-3">
                  {category.name}
                  {!category.isActive ? <span className="text-studio-muted">(прих.)</span> : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <Card className="admin-panel">
                <CardContent className="px-0">
                  {category.services.length ? (
                    <div className="divide-y divide-studio-border">
                      {category.services.map((service) => (
                        <div key={service.id} className="grid gap-3 px-(--card-spacing) py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-base">{service.name}</strong>
                              <Badge variant={service.isActive ? "secondary" : "outline"}>
                                {service.isActive ? "Активна" : "Прихована"}
                              </Badge>
                              {service.requiresConsultation ? <Badge variant="outline">Консультація</Badge> : null}
                              {service.requiresDeposit ? <Badge variant="outline">Депозит</Badge> : null}
                            </div>
                            {service.description ? (
                              <p className="mt-1 line-clamp-2 text-sm leading-6 text-studio-muted">{service.description}</p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-studio-muted">
                              <span>{service.durationMinutes} хв</span>
                              <span>{service.basePriceUah.toLocaleString("uk-UA")} грн</span>
                              <span>Буфер: {service.bufferBeforeMinutes}/{service.bufferAfterMinutes} хв</span>
                              {service.requiresDeposit && service.depositAmountUah !== null ? (
                                <span>Депозит: {service.depositAmountUah.toLocaleString("uk-UA")} грн</span>
                              ) : null}
                            </div>
                          </div>
                          <Button variant="outline" className="h-10 w-full sm:w-auto" onClick={() => openEdit(service)}>
                            <Pencil className="size-4" /> Редагувати
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-(--card-spacing) py-8 text-sm text-studio-muted">
                      У цій категорії ще немає послуг.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="admin-panel mt-6">
          <CardContent>
            <p className="text-sm text-studio-muted">
              Категорій ще немає. Додайте перші категорії у базі, після цього тут можна буде створювати послуги.
            </p>
          </CardContent>
        </Card>
      )}

      <Sheet open={editor.mode !== "closed"} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <SheetContent
          side="bottom"
          className="max-h-[95dvh] rounded-t-2xl bg-studio-surface p-0 text-studio-ink sm:mx-auto sm:max-w-2xl"
          onInteractOutside={(event) => {
            if (selectOpenRef.current) {
              event.preventDefault();
            }
          }}
        >
          <SheetHeader className="border-b border-studio-border px-5 py-4">
            <SheetTitle>{editor.mode === "edit" ? "Редагувати послугу" : "Нова послуга"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={submitService} className="overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Категорія *</Label>
                <Select open={selectOpen} onOpenChange={setCategorySelectOpen} value={form.categoryId} onValueChange={(value) => updateForm("categoryId", value)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Оберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="service-name">Назва *</Label>
                <Input
                  id="service-name"
                  className="h-11"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  minLength={2}
                />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="service-description">Опис</Label>
                <Textarea
                  id="service-description"
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="service-price">Ціна, грн *</Label>
                <Input
                  id="service-price"
                  className="h-11"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.basePriceUah}
                  onChange={(event) => updateForm("basePriceUah", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="service-duration">Тривалість, хв *</Label>
                <Input
                  id="service-duration"
                  className="h-11"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.durationMinutes}
                  onChange={(event) => updateForm("durationMinutes", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="service-buffer-before">Буфер до, хв</Label>
                <Input
                  id="service-buffer-before"
                  className="h-11"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.bufferBeforeMinutes}
                  onChange={(event) => updateForm("bufferBeforeMinutes", event.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="service-buffer-after">Буфер після, хв</Label>
                <Input
                  id="service-buffer-after"
                  className="h-11"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.bufferAfterMinutes}
                  onChange={(event) => updateForm("bufferAfterMinutes", event.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="service-sort">Порядок</Label>
                <Input
                  id="service-sort"
                  className="h-11"
                  type="number"
                  inputMode="numeric"
                  value={form.sortOrder}
                  onChange={(event) => updateForm("sortOrder", event.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="service-deposit">Депозит, грн</Label>
                <Input
                  id="service-deposit"
                  className="h-11"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.depositAmountUah}
                  onChange={(event) => updateForm("depositAmountUah", event.target.value)}
                  disabled={!form.requiresDeposit}
                  required={form.requiresDeposit}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="flex min-h-11 items-center justify-between gap-4 border border-studio-border px-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  {form.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  Показувати на сайті
                </span>
                <input
                  type="checkbox"
                  className="size-4 accent-studio-accent"
                  checked={form.isActive}
                  onChange={(event) => updateForm("isActive", event.target.checked)}
                />
              </label>

              <label className="flex min-h-11 items-center justify-between gap-4 border border-studio-border px-3 text-sm">
                <span>Потребує консультації</span>
                <input
                  type="checkbox"
                  className="size-4 accent-studio-accent"
                  checked={form.requiresConsultation}
                  onChange={(event) => updateForm("requiresConsultation", event.target.checked)}
                />
              </label>

              <label className="flex min-h-11 items-center justify-between gap-4 border border-studio-border px-3 text-sm">
                <span>Потребує депозиту</span>
                <input
                  type="checkbox"
                  className="size-4 accent-studio-accent"
                  checked={form.requiresDeposit}
                  onChange={(event) => updateForm("requiresDeposit", event.target.checked)}
                />
              </label>
            </div>

            <Button className="mt-5 h-11 w-full" type="submit" disabled={saving || !form.categoryId || !form.name.trim()}>
              <Save className="size-4" /> {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
