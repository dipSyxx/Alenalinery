insert into public."ServiceCategory" ("name", "slug", "sortOrder")
values
  ('Фарбування', 'coloring', 1),
  ('Стрижки', 'haircuts', 2),
  ('Відновлення волосся', 'hair-recovery', 3),
  ('Догляд', 'hair-care', 4),
  ('Консультації', 'consultations', 5)
on conflict ("slug") do update
set
  "name" = excluded."name",
  "sortOrder" = excluded."sortOrder";

with service_seed (
  "categorySlug",
  "name",
  "slug",
  "description",
  "basePriceUah",
  "durationMinutes",
  "bufferBeforeMinutes",
  "bufferAfterMinutes",
  "requiresConsultation",
  "requiresDeposit",
  "depositAmountUah",
  "sortOrder"
) as (
  values
    ('consultations', 'Консультація колориста', 'colorist-consultation', 'Оцінка стану волосся, підбір техніки та домашнього догляду.', 500, 45, 0, 0, false, false, null::integer, 1),
    ('haircuts', 'Жіноча стрижка', 'womens-haircut', 'Стрижка з урахуванням форми, текстури та щоденної укладки.', 900, 60, 0, 15, false, false, null::integer, 1),
    ('coloring', 'Тонування волосся', 'hair-toning', 'Оновлення відтінку, блиску та нейтралізація небажаного тону.', 1800, 120, 0, 15, false, false, null::integer, 1),
    ('coloring', 'Складне фарбування', 'complex-coloring', 'Індивідуальна техніка фарбування з попередньою консультацією.', 4500, 300, 0, 30, true, false, null::integer, 2),
    ('hair-recovery', 'Кератинове вирівнювання', 'keratin-treatment', 'Процедура для гладкості, блиску та слухняності волосся.', 3200, 240, 0, 30, false, false, null::integer, 1),
    ('hair-recovery', 'Ботокс для волосся', 'hair-botox', 'Інтенсивне відновлення м’якості та еластичності волосся.', 2800, 180, 0, 30, false, false, null::integer, 2)
)
insert into public."Service" (
  "categoryId",
  "name",
  "slug",
  "description",
  "basePriceUah",
  "durationMinutes",
  "bufferBeforeMinutes",
  "bufferAfterMinutes",
  "requiresConsultation",
  "requiresDeposit",
  "depositAmountUah",
  "sortOrder"
)
select
  category."id",
  service_seed."name",
  service_seed."slug",
  service_seed."description",
  service_seed."basePriceUah",
  service_seed."durationMinutes",
  service_seed."bufferBeforeMinutes",
  service_seed."bufferAfterMinutes",
  service_seed."requiresConsultation",
  service_seed."requiresDeposit",
  service_seed."depositAmountUah",
  service_seed."sortOrder"
from service_seed
join public."ServiceCategory" as category on category."slug" = service_seed."categorySlug"
on conflict ("slug") do update
set
  "categoryId" = excluded."categoryId",
  "name" = excluded."name",
  "description" = excluded."description",
  "basePriceUah" = excluded."basePriceUah",
  "durationMinutes" = excluded."durationMinutes",
  "bufferBeforeMinutes" = excluded."bufferBeforeMinutes",
  "bufferAfterMinutes" = excluded."bufferAfterMinutes",
  "requiresConsultation" = excluded."requiresConsultation",
  "requiresDeposit" = excluded."requiresDeposit",
  "depositAmountUah" = excluded."depositAmountUah",
  "sortOrder" = excluded."sortOrder";

insert into public."WorkingHours" ("weekday", "startTime", "endTime", "isWorkingDay")
select weekday, '10:00', '18:00', weekday between 2 and 6
from generate_series(0, 6) as weekday
on conflict ("weekday") do update
set
  "startTime" = excluded."startTime",
  "endTime" = excluded."endTime",
  "isWorkingDay" = excluded."isWorkingDay";
