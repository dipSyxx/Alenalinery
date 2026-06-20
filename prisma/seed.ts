import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Фарбування", slug: "coloring", sortOrder: 1 },
  { name: "Стрижки", slug: "haircuts", sortOrder: 2 },
  { name: "Відновлення волосся", slug: "hair-recovery", sortOrder: 3 },
  { name: "Догляд", slug: "hair-care", sortOrder: 4 },
  { name: "Консультації", slug: "consultations", sortOrder: 5 },
];

async function main() {
  const categoryBySlug = new Map<string, string>();

  for (const category of categories) {
    const record = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
    categoryBySlug.set(category.slug, record.id);
  }

  const services = [
    {
      categorySlug: "consultations",
      name: "Консультація колориста",
      slug: "colorist-consultation",
      description: "Оцінка стану волосся, підбір техніки та домашнього догляду.",
      basePriceUah: 500,
      durationMinutes: 45,
      sortOrder: 1,
    },
    {
      categorySlug: "haircuts",
      name: "Жіноча стрижка",
      slug: "womens-haircut",
      description: "Стрижка з урахуванням форми, текстури та щоденної укладки.",
      basePriceUah: 900,
      durationMinutes: 60,
      bufferAfterMinutes: 15,
      sortOrder: 1,
    },
    {
      categorySlug: "coloring",
      name: "Тонування волосся",
      slug: "hair-toning",
      description: "Оновлення відтінку, блиску та нейтралізація небажаного тону.",
      basePriceUah: 1800,
      durationMinutes: 120,
      bufferAfterMinutes: 15,
      sortOrder: 1,
    },
    {
      categorySlug: "coloring",
      name: "Складне фарбування",
      slug: "complex-coloring",
      description: "Індивідуальна техніка фарбування з попередньою консультацією.",
      basePriceUah: 4500,
      durationMinutes: 300,
      bufferAfterMinutes: 30,
      requiresConsultation: true,
      sortOrder: 2,
    },
    {
      categorySlug: "hair-recovery",
      name: "Кератинове вирівнювання",
      slug: "keratin-treatment",
      description: "Процедура для гладкості, блиску та слухняності волосся.",
      basePriceUah: 3200,
      durationMinutes: 240,
      bufferAfterMinutes: 30,
      sortOrder: 1,
    },
    {
      categorySlug: "hair-recovery",
      name: "Ботокс для волосся",
      slug: "hair-botox",
      description: "Інтенсивне відновлення м’якості та еластичності волосся.",
      basePriceUah: 2800,
      durationMinutes: 180,
      bufferAfterMinutes: 30,
      sortOrder: 2,
    },
  ];

  for (const service of services) {
    const { categorySlug, ...data } = service;
    const categoryId = categoryBySlug.get(categorySlug);

    if (!categoryId) {
      throw new Error(`Unknown category: ${categorySlug}`);
    }

    await prisma.service.upsert({
      where: { slug: data.slug },
      create: { categoryId, ...data },
      update: { categoryId, ...data },
    });
  }

  const workingDays = new Set([2, 3, 4, 5, 6]);

  for (let weekday = 0; weekday < 7; weekday += 1) {
    await prisma.workingHours.upsert({
      where: { weekday },
      create: {
        weekday,
        startTime: "10:00",
        endTime: "18:00",
        isWorkingDay: workingDays.has(weekday),
      },
      update: {
        startTime: "10:00",
        endTime: "18:00",
        isWorkingDay: workingDays.has(weekday),
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
