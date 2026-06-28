import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminServiceCategories } from "@/lib/data/supabase";

export default async function AdminServicesPage() {
  const categories = await getAdminServiceCategories();

  return (
    <>
      <p className="eyebrow">Послуги</p>
      <h1 className="admin-page-title mt-2 text-5xl">Каталог послуг</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-studio-muted">У цьому MVP каталог доступний для перевірки структури, цін та тривалостей. Повний редактор послуг — наступне ізольоване операційне розширення.</p>
      {categories.length ? (
        <Tabs defaultValue={categories[0].id} className="mt-8">
          <TabsList className="h-auto flex-wrap">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <Card className="admin-panel">
                <CardContent className="px-0">
                  <div className="divide-y divide-studio-border">
                    {category.services.map((service) => (
                      <div key={service.id} className="grid items-center gap-2 px-(--card-spacing) py-3 sm:grid-cols-[1fr_auto_auto]">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong>{service.name}</strong>
                          <Badge variant={service.isActive ? "secondary" : "outline"}>{service.isActive ? "Активна" : "Прихована"}</Badge>
                        </span>
                        <span className="text-sm text-studio-muted">{service.durationMinutes} хв</span>
                        <strong>{service.basePriceUah.toLocaleString("uk-UA")} ₴</strong>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <p className="mt-8 text-sm text-studio-muted">Послуг ще немає.</p>
      )}
    </>
  );
}
