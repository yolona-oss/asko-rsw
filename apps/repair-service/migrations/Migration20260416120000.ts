import { Migration } from '@mikro-orm/migrations';

export class Migration20260416120000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "address" add column "timezone" varchar(50) null;`);
        this.addSql(`alter table "repairer" add column "timezone" varchar(50) null;`);

        // Backfill timezone for existing rows based on city
        const cityTz: Record<string, string> = {
            'Калининград': 'Europe/Kaliningrad',
            'Москва': 'Europe/Moscow',
            'Санкт-Петербург': 'Europe/Moscow',
            'Казань': 'Europe/Moscow',
            'Нижний Новгород': 'Europe/Moscow',
            'Ростов-на-Дону': 'Europe/Moscow',
            'Воронеж': 'Europe/Moscow',
            'Краснодар': 'Europe/Moscow',
            'Сочи': 'Europe/Moscow',
            'Волгоград': 'Europe/Moscow',
            'Самара': 'Europe/Samara',
            'Ижевск': 'Europe/Samara',
            'Саратов': 'Europe/Samara',
            'Астрахань': 'Europe/Samara',
            'Екатеринбург': 'Asia/Yekaterinburg',
            'Челябинск': 'Asia/Yekaterinburg',
            'Уфа': 'Asia/Yekaterinburg',
            'Пермь': 'Asia/Yekaterinburg',
            'Тюмень': 'Asia/Yekaterinburg',
            'Омск': 'Asia/Omsk',
            'Новосибирск': 'Asia/Novosibirsk',
            'Красноярск': 'Asia/Krasnoyarsk',
            'Барнаул': 'Asia/Barnaul',
            'Иркутск': 'Asia/Irkutsk',
            'Якутск': 'Asia/Yakutsk',
            'Чита': 'Asia/Yakutsk',
            'Владивосток': 'Asia/Vladivostok',
            'Хабаровск': 'Asia/Vladivostok',
            'Магадан': 'Asia/Magadan',
            'Южно-Сахалинск': 'Asia/Sakhalin',
            'Петропавловск-Камчатский': 'Asia/Kamchatka',
        };

        for (const [city, tz] of Object.entries(cityTz)) {
            const escaped = city.replace(/'/g, "''");
            this.addSql(`update "repairer" set "timezone" = '${tz}' where "city" = '${escaped}' and "timezone" is null;`);
            this.addSql(`update "address" set "timezone" = '${tz}' where "city" = '${escaped}' and "timezone" is null;`);
        }
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "address" drop column "timezone";`);
        this.addSql(`alter table "repairer" drop column "timezone";`);
    }
}
