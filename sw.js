// Service Worker для кеширования ресурсов
const CACHE_NAME = 'esscale-v1.0.0';
const STATIC_CACHE = 'esscale-static-v1.0.0';

// Ресурсы для кеширования
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/reset.css',
    '/css/style.css',
    '/css/headline.css',
    '/fonts/fontstyle.css',
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-SemiBold.woff2',
    '/fonts/Inter-Bold.woff2',
    '/fonts/KumbhSans-Regular.woff2',
    '/fonts/SpaceGrotesk-Medium.woff2',
    '/js/main.js',
    '/js/particles-init.js',
    '/images/logo.svg',
    '/images/mobile.png',
    '/images/sait.png',
    '/images/school.jpg',
    '/images/Data Science и Machine Learning.png',
    '/images/Консалтинг и Аудит.png',
    '/images/Наукоемкое ПО и R&D.png',
    '/images/Сложная веб-разработка.png',
    '/images/мобильная.png',
    '/images/vk-logo.svg',
    '/images/youtube-svgrepo-com.svg',
    '/esscale_pricelist.pdf'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Кеширование статических ресурсов');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                            console.log('Удаление старого кеша:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    // Пропускаем внешние запросы
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кеша если есть
                if (response) {
                    return response;
                }

                // Иначе загружаем из сети
                return fetch(event.request)
                    .then(response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Клонируем ответ для кеширования
                        const responseToCache = response.clone();

                        caches.open(STATIC_CACHE)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Fallback для HTML страниц
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});
