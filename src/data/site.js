/* ============================================================
   Единая точка правды по контактам и цене.

   В старой версии контакты были рассыпаны по восьми местам
   разметки, телефон дублировался ещё и в PDF, а два разных
   Telegram жили в шапке и в контактах и вели к разным людям.
   Здесь всё в одном месте: замена — одна строка.

   ВРЕМЕННЫЕ ЗНАЧЕНИЯ помечены в PLACEHOLDERS ниже. Сборка
   предупредит, если они доживут до продакшена.
   ============================================================ */

export const site = {
  name: 'Esscale',
  domain: 'esscale.ru',
  url: 'https://esscale.ru/',

  telegram: 'https://t.me/sborka_esscale',
  telegramLabel: '@sborka_esscale',

  pricing: {
    /* Стоимость одного Esscale Point. В методике фигурирует
       4150 ₽ со словом «предположим» — то есть не зафиксирована
       и зависит от состава команды. Поэтому вилка, а не точка. */
    rublesPerEP: { min: 3500, max: 5000 },   // ЗАГЛУШКА

    /* Скорость команды — из методики, значение реальное. */
    velocityPerWeek: 15,
  },

  /* Дистрибутив Scandere.

     Флаг ready управляет и разметкой, и поведением: пока он false,
     кнопка отрисовывается как «скоро» и не ведёт никуда. Это надёжнее
     живой ссылки на пустоту — посетитель не упирается в 404. Когда
     появятся настоящие адреса, меняются две строки и ready. */
  downloads: {
    rustore: {
      label: 'Скачать в RuStore',
      note: 'Android',
      href: 'https://www.rustore.ru/catalog/app/com.esscale.scandere',
      ready: true,
    },
    appstore: {
      label: 'Скачать в App Store',
      note: 'iOS',
      href: '#',            // ЗАГЛУШКА — ждём ссылку в App Store
      ready: false,
    },
    windows: {
      label: 'Версия для Windows',
      note: 'x64 · установщик .exe',
      /* Ссылка на latest в релизах: она не меняется при выпуске
         новой версии, поэтому обновлять сайт под каждый билд
         не придётся. */
      href: 'https://github.com/moiseyevanton/scandere-releases/releases/latest/download/scandere-setup.exe',
      ready: true,
      external: true,
    },
  },
}

/* Что ещё не заменено на настоящее. Список читает сборка. */
export const PLACEHOLDERS = ['pricing.rublesPerEP', 'downloads.appstore']
