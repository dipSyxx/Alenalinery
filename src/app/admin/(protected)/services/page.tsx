import { AdminServicesWorkspace } from "@/components/admin-services-workspace";
import { getAdminServiceCategories } from "@/lib/data/supabase";

export default async function AdminServicesPage() {
  const categories = await getAdminServiceCategories();

  return (
    <>
      <p className="eyebrow">Послуги</p>
      <h1 className="admin-page-title mt-2 text-5xl">Каталог послуг</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-studio-muted">
        Керуйте цінами, тривалістю, буферами, депозитами та видимістю послуг на сайті.
      </p>
      <AdminServicesWorkspace categories={categories} />
    </>
  );
}
