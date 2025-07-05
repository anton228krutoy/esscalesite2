// js/particles-init.js

const particlesConfig = {
    // Говорим библиотеке, что мы сами будем управлять размером и положением холста
    fullScreen: {
        enable: false
    },

    particles: {
        number: {
            value: 100, // Количество точек
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
            speed: 2, // Скорость движения точек
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
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
                enable: true,
                mode: "push"
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 140,
                line_linked: {
                    opacity: 1
                }
            },
            push: {
                particles_nb: 3
            }
        }
    },
    retina_detect: true
};

// Инициализируем анимацию
tsParticles.load("particles-js", particlesConfig);