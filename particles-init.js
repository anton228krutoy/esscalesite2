// js/particles-init.js

const particlesConfig = {
    // Говорим библиотеке, что мы сами будем управлять размером и положением холста
    fullScreen: {
        enable: false
    },

    particles: {
        number: {
            value: 80, // Уменьшаем базовое количество точек
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: "#4ADBC8" // Цвет точек
        },
        shape: {
            type: "circle"
        },
        opacity: {
            value: 0.5,
            random: false,
            anim: {
                enable: false
            }
        },
        size: {
            value: 3, // Размер точек
            random: true,
            anim: {
                enable: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150, // Максимальное расстояние для соединения
            color: "#59e4d1", // Цвет линий
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 1.5, // Немного уменьшаем скорость для более плавного движения
            direction: "none",
            random: true, // Включаем случайность для более естественного движения
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
                enable: false
            }
        }
    },
    interactivity: {
        detect_on: "window",
        events: {
            onhover: {
                enable: true,
                mode: "grab"
            },
            onclick: {
                enable: false
            },
            resize: true
        },
        modes: {
            connect: {
                distance: 200,
                radius: 200,
                links: {
                    opacity: 0.8,
                    color: "#4ADBC8"
                }
            },
            grab: {
                distance: 200,
                line_linked: {
                    opacity: 1
                }
            },
            repulse: {
                distance: 250,
                duration: 0.6,
                speed: 2
            }
        }
    },
    retina_detect: true
};

// Инициализируем анимацию с проверкой загрузки библиотеки
function initParticlesBackground() {
    if (typeof tsParticles !== 'undefined') {
        tsParticles.load("particles-js", particlesConfig);
    } else {
        // Если библиотека еще не загружена, ждем и пытаемся снова
        setTimeout(initParticlesBackground, 100);
    }
}

// Запускаем инициализацию
initParticlesBackground();