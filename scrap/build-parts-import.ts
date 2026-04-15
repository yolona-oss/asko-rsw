// Build a device-parts-import JSON compatible with the ImportDeviceParts RPC.
//
// Source:   ./asko_products.import.json  (361 devices across 6 categories)
// Output:   ./device_parts.import.json
//
// For each device in the import file, generates a realistic set of spare parts
// based on the device category. Parts include model-specific part numbers,
// randomized prices (±20% around base), and Russian descriptions.
//
// The importer matches parts to devices via slugify(`${brand}-${model}-${name}`)
// — the same slug the device importer uses.

import fs from 'node:fs';
import path from 'node:path';

type Product = Record<string, any>;

interface PartTemplate {
    name: string;
    group: string;
    basePrice: number;
    description: string;
}

// ── Part templates per device category ──────────────────────────────────

const WASHING_MACHINE_PARTS: PartTemplate[] = [
    { name: 'Электродвигатель (мотор)', group: 'Привод и мотор', basePrice: 18000, description: 'Бесщеточный электродвигатель BLDC' },
    { name: 'Приводной ремень', group: 'Привод и мотор', basePrice: 1100, description: 'Ремень привода барабана' },
    { name: 'Барабан', group: 'Барабан и бак', basePrice: 12000, description: 'Барабан из нержавеющей стали Active Drum' },
    { name: 'Подшипник барабана', group: 'Барабан и бак', basePrice: 2200, description: 'Подшипник вала барабана' },
    { name: 'Сальник подшипника', group: 'Барабан и бак', basePrice: 450, description: 'Сальник уплотнительный для подшипника барабана' },
    { name: 'Амортизатор', group: 'Барабан и бак', basePrice: 1800, description: 'Амортизатор бака (демпфер)' },
    { name: 'Пружина подвески бака', group: 'Барабан и бак', basePrice: 900, description: 'Пружина верхней подвески бака' },
    { name: 'Помпа (сливной насос)', group: 'Система воды', basePrice: 3000, description: 'Сливной насос (помпа) с крыльчаткой' },
    { name: 'Заливной клапан', group: 'Система воды', basePrice: 2200, description: 'Электромагнитный клапан подачи воды' },
    { name: 'Фильтр сливного насоса', group: 'Система воды', basePrice: 500, description: 'Фильтр-ловушка сливного насоса' },
    { name: 'ТЭН (нагревательный элемент)', group: 'Нагрев', basePrice: 3000, description: 'Трубчатый электронагреватель воды' },
    { name: 'Термодатчик', group: 'Нагрев', basePrice: 1100, description: 'Датчик температуры воды (NTC)' },
    { name: 'Манжета люка', group: 'Дверца', basePrice: 3500, description: 'Резиновый уплотнитель загрузочного люка' },
    { name: 'Замок блокировки люка (УБЛ)', group: 'Дверца', basePrice: 1800, description: 'Устройство блокировки люка электромеханическое' },
    { name: 'Стекло люка', group: 'Дверца', basePrice: 2200, description: 'Стекло дверцы люка (двойное)' },
    { name: 'Ручка люка', group: 'Дверца', basePrice: 650, description: 'Ручка открывания дверцы люка' },
    { name: 'Электронный модуль управления', group: 'Управление', basePrice: 14000, description: 'Основная плата электронного управления' },
    { name: 'Панель управления', group: 'Управление', basePrice: 4500, description: 'Передняя панель управления с кнопками' },
    { name: 'Бункер дозатора моющих средств', group: 'Дозатор', basePrice: 2200, description: 'Бункер (кювета) для порошка и кондиционера' },
];

const OVEN_PARTS: PartTemplate[] = [
    { name: 'Верхний ТЭН', group: 'Нагрев', basePrice: 3800, description: 'Верхний трубчатый нагревательный элемент' },
    { name: 'Нижний ТЭН', group: 'Нагрев', basePrice: 3800, description: 'Нижний трубчатый нагревательный элемент' },
    { name: 'Гриль ТЭН', group: 'Нагрев', basePrice: 4500, description: 'Нагревательный элемент гриля' },
    { name: 'Конвекционный ТЭН (кольцевой)', group: 'Нагрев', basePrice: 5200, description: 'Кольцевой нагреватель конвекции' },
    { name: 'Термостат', group: 'Нагрев', basePrice: 1800, description: 'Терморегулятор камеры' },
    { name: 'Температурный датчик', group: 'Нагрев', basePrice: 1100, description: 'Датчик температуры (термопара)' },
    { name: 'Вентилятор конвекции', group: 'Вентиляция', basePrice: 3000, description: 'Вентилятор конвекционного обдува с мотором' },
    { name: 'Вентилятор охлаждения', group: 'Вентиляция', basePrice: 2200, description: 'Вентилятор охлаждения корпуса' },
    { name: 'Стекло дверцы (внешнее)', group: 'Дверца', basePrice: 4500, description: 'Наружное стекло дверцы духового шкафа' },
    { name: 'Стекло дверцы (внутреннее)', group: 'Дверца', basePrice: 3000, description: 'Внутреннее жаропрочное стекло дверцы' },
    { name: 'Петля дверцы', group: 'Дверца', basePrice: 2200, description: 'Петля дверцы с пружинным механизмом' },
    { name: 'Уплотнитель дверцы', group: 'Дверца', basePrice: 1800, description: 'Термостойкий уплотнитель по периметру дверцы' },
    { name: 'Электронный модуль управления', group: 'Управление', basePrice: 15000, description: 'Основная плата электронного управления' },
    { name: 'Переключатель режимов', group: 'Управление', basePrice: 1500, description: 'Поворотный переключатель режимов нагрева' },
    { name: 'Противень', group: 'Внутренние элементы', basePrice: 2200, description: 'Эмалированный противень для выпечки' },
    { name: 'Направляющие телескопические', group: 'Внутренние элементы', basePrice: 3200, description: 'Телескопические направляющие полного выдвижения' },
    { name: 'Лампа освещения', group: 'Внутренние элементы', basePrice: 500, description: 'Лампа освещения камеры (термостойкая)' },
];

const FRIDGE_PARTS: PartTemplate[] = [
    { name: 'Компрессор', group: 'Компрессорный узел', basePrice: 18000, description: 'Инверторный компрессор холодильной камеры' },
    { name: 'Конденсатор', group: 'Компрессорный узел', basePrice: 4500, description: 'Конденсатор (теплообменник наружный)' },
    { name: 'Испаритель', group: 'Компрессорный узел', basePrice: 6000, description: 'Испаритель (теплообменник внутренний)' },
    { name: 'Фильтр-осушитель', group: 'Компрессорный узел', basePrice: 1500, description: 'Фильтр-осушитель хладагента' },
    { name: 'Вентилятор', group: 'Вентиляция', basePrice: 3000, description: 'Вентилятор циркуляции воздуха с мотором' },
    { name: 'Уплотнитель двери (верхний)', group: 'Уплотнения', basePrice: 3000, description: 'Магнитный уплотнитель двери верхней камеры' },
    { name: 'Уплотнитель двери (нижний)', group: 'Уплотнения', basePrice: 3500, description: 'Магнитный уплотнитель двери нижней камеры' },
    { name: 'Электронный модуль управления', group: 'Управление', basePrice: 12000, description: 'Электронная плата управления' },
    { name: 'Термостат', group: 'Управление', basePrice: 2200, description: 'Терморегулятор (термостат)' },
    { name: 'Температурный датчик', group: 'Управление', basePrice: 1100, description: 'Датчик температуры (NTC)' },
    { name: 'Полка стеклянная', group: 'Внутренние элементы', basePrice: 2200, description: 'Стеклянная полка с обрамлением' },
    { name: 'Ящик для овощей', group: 'Внутренние элементы', basePrice: 3000, description: 'Выдвижной ящик зоны свежести' },
    { name: 'Балкон дверной', group: 'Внутренние элементы', basePrice: 1100, description: 'Полка-балкон на двери' },
    { name: 'Лампа освещения LED', group: 'Внутренние элементы', basePrice: 850, description: 'Светодиодная лампа освещения камеры' },
    { name: 'ТЭН оттайки', group: 'Система оттайки', basePrice: 3000, description: 'Нагреватель системы автоматической оттайки' },
    { name: 'Таймер оттайки', group: 'Система оттайки', basePrice: 1800, description: 'Таймер цикла оттайки' },
];

const DISHWASHER_PARTS: PartTemplate[] = [
    { name: 'Циркуляционный насос', group: 'Система мойки', basePrice: 7500, description: 'Основной циркуляционный насос подачи воды' },
    { name: 'Сливной насос (помпа)', group: 'Система мойки', basePrice: 3000, description: 'Сливной насос с крыльчаткой' },
    { name: 'Верхнее коромысло (импеллер)', group: 'Система мойки', basePrice: 1100, description: 'Верхний разбрызгиватель воды' },
    { name: 'Нижнее коромысло (импеллер)', group: 'Система мойки', basePrice: 1100, description: 'Нижний разбрызгиватель воды' },
    { name: 'Заливной клапан', group: 'Система подачи воды', basePrice: 2200, description: 'Электромагнитный клапан подачи воды' },
    { name: 'Заливной шланг с аквастопом', group: 'Система подачи воды', basePrice: 1500, description: 'Шланг подачи воды с защитой от протечек' },
    { name: 'ТЭН (проточный)', group: 'Нагрев', basePrice: 4500, description: 'Проточный нагревательный элемент воды' },
    { name: 'Термостат', group: 'Нагрев', basePrice: 1100, description: 'Датчик-регулятор температуры воды' },
    { name: 'Верхняя корзина', group: 'Корзины', basePrice: 4500, description: 'Верхняя корзина для посуды' },
    { name: 'Нижняя корзина', group: 'Корзины', basePrice: 5200, description: 'Нижняя корзина для посуды' },
    { name: 'Корзина для столовых приборов', group: 'Корзины', basePrice: 1100, description: 'Съемная корзина для столовых приборов' },
    { name: 'Замок дверцы', group: 'Дверца', basePrice: 1800, description: 'Замок-защелка дверцы с микровыключателем' },
    { name: 'Петля дверцы', group: 'Дверца', basePrice: 1500, description: 'Петля дверцы с пружинным механизмом' },
    { name: 'Уплотнитель дверцы', group: 'Дверца', basePrice: 1800, description: 'Уплотнительная резинка по периметру дверцы' },
    { name: 'Электронный модуль управления', group: 'Управление', basePrice: 12000, description: 'Основная плата электронного управления' },
    { name: 'Фильтр грубой очистки', group: 'Фильтрация', basePrice: 750, description: 'Сетчатый фильтр грубой очистки воды' },
    { name: 'Дозатор моющего средства', group: 'Фильтрация', basePrice: 2200, description: 'Контейнер-дозатор для таблеток и порошка' },
];

const COOKTOP_PARTS: PartTemplate[] = [
    { name: 'Конфорка (HiLight)', group: 'Нагревательные элементы', basePrice: 3000, description: 'Нагревательный элемент конфорки HiLight' },
    { name: 'Индукционная катушка', group: 'Нагревательные элементы', basePrice: 6000, description: 'Индукционная катушка генератора' },
    { name: 'Электронный модуль управления', group: 'Управление', basePrice: 12000, description: 'Силовая плата управления конфорками' },
    { name: 'Сенсорная панель управления', group: 'Управление', basePrice: 7500, description: 'Сенсорная панель с контроллером Touch' },
    { name: 'Переключатель мощности', group: 'Управление', basePrice: 1500, description: 'Регулятор мощности нагрева' },
    { name: 'Стеклокерамическая поверхность', group: 'Стеклокерамика', basePrice: 14000, description: 'Стеклокерамическая варочная поверхность' },
    { name: 'Вентилятор охлаждения', group: 'Вентиляция', basePrice: 2200, description: 'Вентилятор охлаждения электроники' },
    { name: 'Кабель питания', group: 'Прочее', basePrice: 750, description: 'Силовой кабель подключения' },
    { name: 'Уплотнитель', group: 'Прочее', basePrice: 600, description: 'Уплотнительная прокладка по периметру' },
    { name: 'Клеммная колодка', group: 'Прочее', basePrice: 450, description: 'Клеммная колодка подключения питания' },
];

const OTHER_PARTS: PartTemplate[] = [
    { name: 'Жировой фильтр', group: 'Фильтрация', basePrice: 1100, description: 'Металлический жировой фильтр' },
    { name: 'Угольный фильтр', group: 'Фильтрация', basePrice: 1800, description: 'Угольный фильтр для рециркуляции' },
    { name: 'Мотор вентилятора', group: 'Вентиляция', basePrice: 4500, description: 'Электродвигатель вентилятора вытяжки' },
    { name: 'Крыльчатка', group: 'Вентиляция', basePrice: 1100, description: 'Крыльчатка (турбина) вентилятора' },
    { name: 'Воздуховод', group: 'Вентиляция', basePrice: 900, description: 'Пластиковый воздуховод' },
    { name: 'Лампа освещения', group: 'Освещение', basePrice: 500, description: 'Лампа подсветки рабочей зоны' },
    { name: 'Электронный модуль управления', group: 'Управление', basePrice: 8500, description: 'Плата электронного управления' },
    { name: 'Переключатель скоростей', group: 'Управление', basePrice: 1100, description: 'Переключатель скоростей вентилятора' },
];

const PARTS_BY_CATEGORY: Record<string, PartTemplate[]> = {
    washing_machine: WASHING_MACHINE_PARTS,
    oven: OVEN_PARTS,
    fridge: FRIDGE_PARTS,
    dishwasher: DISHWASHER_PARTS,
    cooktop: COOKTOP_PARTS,
    other: OTHER_PARTS,
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Randomize price ±20% around base, rounded to nearest 100. */
function randomizePrice(base: number): number {
    const factor = 0.8 + Math.random() * 0.4; // 0.8 … 1.2
    return Math.round((base * factor) / 100) * 100;
}

/** Generate a part number from model and sequential index. */
function partNumber(model: string, index: number): string {
    const clean = model.replace(/[^A-Za-z0-9]/g, '');
    return `${clean}-${String(index + 1).padStart(3, '0')}`;
}

// ── Main ────────────────────────────────────────────────────────────────

const SRC = path.join(__dirname, 'asko_products.import.json');
const OUT = path.join(__dirname, 'device_parts.import.json');

const devices: Product[] = JSON.parse(fs.readFileSync(SRC, 'utf-8'));

interface PartEntry {
    deviceModel: string;
    deviceBrand: string;
    deviceName: string;
    categoryName: string;
    name: string;
    partNumber: string;
    price: number;
    group: string;
    description: string;
}

const parts: PartEntry[] = [];

for (const device of devices) {
    const category = device.type ?? 'other';
    const templates = PARTS_BY_CATEGORY[category] ?? PARTS_BY_CATEGORY['other']!;
    const model = device.model ?? '';
    const brand = device.brand ?? 'Asko';
    const deviceName = device.name ?? '';

    for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        parts.push({
            deviceModel: model,
            deviceBrand: brand,
            deviceName: deviceName,
            categoryName: category,
            name: t.name,
            partNumber: partNumber(model, i),
            price: randomizePrice(t.basePrice),
            group: t.group,
            description: `${t.description} для ${brand} ${model}`,
        });
    }
}

fs.writeFileSync(OUT, JSON.stringify(parts, null, 2));

// Summary
const summary: Record<string, { devices: number; parts: number }> = {};
for (const device of devices) {
    const cat = device.type ?? 'other';
    if (!summary[cat]) summary[cat] = { devices: 0, parts: 0 };
    summary[cat].devices++;
    summary[cat].parts += (PARTS_BY_CATEGORY[cat] ?? PARTS_BY_CATEGORY['other']!).length;
}

console.log('Wrote', OUT);
console.log('Total parts:', parts.length);
console.table(summary);
