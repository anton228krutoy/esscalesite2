import { Renderer, Program, Mesh, Triangle } from 'ogl'
import fragment from './field.frag?raw'

const vertex = /* glsl */ `#version 300 es
in vec2 uv;
in vec2 position;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`

/* Цвета берём из CSS-токенов, а не дублируем константами.
   В старой версии акцент жил в четырёх несинхронизированных
   местах — токене, rgba-свечениях, конфиге частиц и манифесте,
   и сменить его одним движением было нельзя. */
function tokenRGB(name, fallback) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const parts = raw.split(/[\s,]+/).map(Number).filter(n => !Number.isNaN(n))
  if (parts.length < 3) return fallback
  return parts.slice(0, 3).map(n => n / 255)
}

/* Плотность пикселей поля. Потолок — число пикселей, а не множитель:
   при множителе 2 поле на 14-дюймовом Retina считалось на 5,2 млн
   пикселей, на 5K-мониторе — на 14,7 млн, каждый кадр и всегда.
   Разницы на глаз нет: толщину линий в экранных пикселях держит
   uLineScale (field.frag). Ниже 1× не опускаемся — на обычном
   мониторе картинка ровно та же, что была. Считается от размера
   самого холста, а не окна: на телефоне холст выше окна (layout.css). */
const MAX_PIXELS = 2.1e6
const nativeDpr = () => Math.min(window.devicePixelRatio || 1, 2)

/* На телефоне и планшете без мыши — не больше полутора пикселей поля
   на пиксель CSS. Потолок числа пикселей там не срабатывал: экран мал,
   и поле считалось в 2× — 1,2–1,5 млн пикселей на кадр, по 25 вызовов
   шума на каждый, 30 раз в секунду всю прокрутку. Видеокарта телефона
   делила эту работу с прокруткой самой страницы. В 1,5× работы на 40 %
   меньше, а толщину линий в экранных пикселях держит uLineScale — как
   на Retina. Планшеты и так ниже 1,5× по общему потолку. */
const TOUCH = matchMedia('(hover: none) and (pointer: coarse)').matches
const TOUCH_MAX_DPR = 1.5

function fieldDpr(w, h) {
  const fit = Math.sqrt(MAX_PIXELS / (w * h))
  const cap = TOUCH ? Math.min(nativeDpr(), TOUCH_MAX_DPR) : nativeDpr()
  return Math.max(Math.min(cap, fit), Math.min(nativeDpr(), 1))
}

/* 30 кадров в секунду, а не частота экрана (на ProMotion — 120):
   поле дрейфует медленно (uTime · 0.028), и на глаз разницы нет,
   а работы видеокарте вчетверо меньше. Между кадрами — таймер,
   а не холостые rAF: так страница по-настоящему простаивает.
   Минус 8 мс — чтобы rAF попал на ближайший кадр экрана, а не на
   следующий за ним.

   В покое — 15: пока страницу не крутят и не водят мышью, поле
   только медленно дрейфует, а каждый его кадр — это сборка всего
   экрана. Любое движение или команда снаружи сразу возвращают 30. */
const FRAME_MS = 1000 / 30
const IDLE_FRAME_MS = 1000 / 15
const IDLE_AFTER_MS = 2000

export function createField(canvas) {
  const renderer = new Renderer({
    canvas,
    alpha: true,
    depth: false,              // один треугольник на весь экран — буфер глубины не нужен
    antialias: false,          // изолинии сглаживает сам шейдер через fwidth
    /* Декоративный фон — не повод будить дискретную видеокарту:
       на MacBook с двумя видеокартами high-performance переключал
       на неё всю систему — нагрев, батарея и заминка при переключении. */
    powerPreference: 'low-power',
  })
  /* Размер холста задаёт CSS (.field в layout.css). OGL при создании
     пишет холсту инлайновые 300×150 px, и они перебили бы CSS — снимаем.
     Буфер дальше размечает fit(), без renderer.setSize: тот снова
     вписывал бы размер окна в px поверх CSS. */
  canvas.style.removeProperty('width')
  canvas.style.removeProperty('height')
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    uniforms: {
      uTime:          { value: 0 },
      uResolution:    { value: [1, 1] },
      uMouse:         { value: [0.5, 0.5] },
      uMouseStrength: { value: 0 },
      uDensity:       { value: 9.0 },
      uProgress:      { value: 0 },
      uIntensity:     { value: 0 },   // проявляется после загрузки
      uCool:          { value: tokenRGB('--rgb-cool', [0.18, 0.73, 0.65]) },
      uSignal:        { value: tokenRGB('--rgb-signal', [1, 0.71, 0.33]) },
      uSignalMix:     { value: 0 },
      uLineScale:     { value: 1 },   // см. fit
    },
  })

  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
  const u = program.uniforms

  // Целевые значения; фактические подтягиваются к ним каждый кадр,
  // поэтому любое изменение снаружи выглядит как переток, а не скачок.
  const baseCool = u.uCool.value.slice()
  const target = {
    density: 9.0, progress: 0, intensity: 1, signalMix: 0,
    mouse: [0.5, 0.5],
    cool: baseCool.slice(),
  }
  let raf = 0
  let timer = 0
  let running = false
  let lastInput = -Infinity
  const wake = () => { lastInput = performance.now() }
  let last = performance.now()
  let clock = 0

  /* Буфер — по размеру самого холста, а не окна. Холст высотой в большой
     экран (layout.css), и панель браузера на телефоне, которая при
     прокрутке прячется и появляется, его не меняет. Раньше каждое её
     движение пересоздавало буфер: он при этом очищается, и поле пропадало
     до следующего своего кадра, а рисунок, который меряется в высотах
     холста (field.frag), прыгал — посреди жеста. Теперь буфер
     пересоздаётся только при настоящей смене размера — поворот, ресайз
     окна, масштаб, — и тут же перерисовывается: пустым его не покажут. */
  let cssW = 1
  let cssH = 1
  let bufW = 0
  let bufH = 0
  function fit(w, h) {
    if (!(w > 0 && h > 0)) return
    cssW = w
    cssH = h
    const dpr = fieldDpr(w, h)
    const bw = Math.max(1, Math.round(w * dpr))
    const bh = Math.max(1, Math.round(h * dpr))
    if (bw === bufW && bh === bufH) return
    bufW = bw
    bufH = bh
    canvas.width = bw
    canvas.height = bh
    // Для OGL — пиксель на единицу: вьюпорт в render() ровно равен
    // буферу, без дробного dpr и усечения.
    renderer.dpr = 1
    renderer.width = bw
    renderer.height = bh
    u.uResolution.value = [bw, bh]
    // Сколько пикселей поля приходится на пиксель экрана: меньше единицы,
    // когда поле считается грубее экрана. По нему шейдер пересчитывает
    // толщину линий обратно в экранные пиксели.
    u.uLineScale.value = bw / w / nativeDpr()
    renderer.render({ scene: mesh })
  }
  const fitToBox = () => {
    const r = canvas.getBoundingClientRect()
    fit(r.width, r.height)
  }

  // Размер холста — сразу после раскладки, в том же кадре: новый буфер
  // успевает получить картинку до того, как его покажут.
  const sizer = new ResizeObserver(entries => {
    const { width, height } = entries[entries.length - 1].contentRect
    fit(width, height)
  })

  /* Смену плотности экрана без смены размера (окно перенесли на другой
     монитор) ResizeObserver не видит — её ловим по resize, как раньше.
     На телефоне resize идёт и от панели браузера, но размер холста при
     этом тот же, и fit ничего не делает. */
  let resizePending = false
  function resize() {
    if (resizePending) return
    resizePending = true
    requestAnimationFrame(() => { resizePending = false; fitToBox() })
  }

  const request = () => { timer = 0; raf = requestAnimationFrame(frame) }

  function frame(now) {
    raf = 0
    // Следующий кадр планируем сразу, до отрисовки: если она бросит
    // исключение, поле не должно замереть навсегда.
    if (running) {
      const pace = now - lastInput > IDLE_AFTER_MS ? IDLE_FRAME_MS : FRAME_MS
      timer = setTimeout(request, pace - 8)
    }
    // Дельта ограничена: после возврата на вкладку поле не прыгает вперёд.
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    clock += dt

    const k = 1 - Math.pow(0.001, dt)   // сглаживание, независимое от fps
    u.uTime.value = clock
    u.uDensity.value   += (target.density   - u.uDensity.value)   * k
    u.uProgress.value  += (target.progress  - u.uProgress.value)  * k
    u.uIntensity.value += (target.intensity - u.uIntensity.value) * k
    u.uSignalMix.value += (target.signalMix - u.uSignalMix.value) * k
    u.uMouse.value[0]  += (target.mouse[0] - u.uMouse.value[0]) * k * 0.6
    u.uMouse.value[1]  += (target.mouse[1] - u.uMouse.value[1]) * k * 0.6

    // Цвет поля перетекает так же, как всё остальное: покомпонентно,
    // за один кадр — иначе смена направления читалась бы как рывок.
    for (let i = 0; i < 3; i++) {
      u.uCool.value[i] += (target.cool[i] - u.uCool.value[i]) * k * 0.5
    }

    renderer.render({ scene: mesh })
  }

  function start() {
    if (running) return
    running = true
    last = performance.now()
    request()
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
    clearTimeout(timer)
    raf = timer = 0
  }

  const onPointer = e => {
    /* Только мышь. Касание — это прокрутка: браузер присылает pointermove
       ещё до того, как палец повёл страницу, и поле выгибалось под пальцем
       в начале жеста. А на iPhone pointerleave до document не доходит
       (WebKit шлёт его только элементам), и выгиб оставался навсегда,
       переезжая за пальцем от жеста к жесту. */
    if (e.pointerType !== 'mouse') return
    wake()
    target.mouse = [e.clientX / cssW, 1 - e.clientY / cssH]
    u.uMouseStrength.value = 1
  }
  const onLeave = () => { u.uMouseStrength.value = 0 }
  const onVisibility = () => (document.hidden ? stop() : start())

  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('pointerleave', onLeave, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  fitToBox()
  sizer.observe(canvas)
  start()

  return {
    /* Плотность поля. Это тот самый рычаг, за который берётся
       калькулятор: чем больше набрано EP, тем гуще изолинии. */
    // Каждая команда снаружи будит поле: переход к новому значению
    // должен идти на полных 30 кадрах, а не в режиме покоя.
    setDensity: v => { target.density = v; wake() },
    setProgress: v => { target.progress = v; wake() },
    setIntensity: v => { target.intensity = v; wake() },
    setSignalMix: v => { target.signalMix = v; wake() },

    /* Акцент сцены. Принимает три компонента 0–255 — те же, что
       лежат в данных направлений, чтобы источник цвета оставался
       один. Без аргумента возвращает исходный цвет темы. */
    setAccent(rgb) {
      wake()
      target.cool = rgb
        ? rgb.map(n => Math.min(Math.max(Number(n) || 0, 0), 255) / 255)
        : baseCool.slice()
    },
    start,
    stop,
    destroy() {
      stop()
      sizer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      const ext = gl.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    },
  }
}
