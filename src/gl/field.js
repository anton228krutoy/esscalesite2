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

export function createField(canvas) {
  const renderer = new Renderer({
    canvas,
    alpha: true,
    antialias: false,          // изолинии сглаживает сам шейдер через fwidth
    powerPreference: 'high-performance',
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  })
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
  let raf = null
  let running = false
  let last = performance.now()
  let clock = 0

  let resizePending = false
  function applyResize() {
    resizePending = false
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h)
    u.uResolution.value = [w * renderer.dpr, h * renderer.dpr]
  }

  /* Пересоздание буфера — самая дорогая операция здесь, а на
     мобильных появление и скрытие адресной строки при прокрутке
     генерирует поток resize. Схлопываем их в один за кадр. */
  function resize() {
    if (resizePending) return
    resizePending = true
    requestAnimationFrame(applyResize)
  }

  function frame(now) {
    raf = requestAnimationFrame(frame)
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
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = null
  }

  const onPointer = e => {
    target.mouse = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight]
    u.uMouseStrength.value = 1
  }
  const onLeave = () => { u.uMouseStrength.value = 0 }
  const onVisibility = () => (document.hidden ? stop() : start())

  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('pointerleave', onLeave, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  applyResize()
  start()

  return {
    /* Плотность поля. Это тот самый рычаг, за который берётся
       калькулятор: чем больше набрано EP, тем гуще изолинии. */
    setDensity: v => { target.density = v },
    setProgress: v => { target.progress = v },
    setIntensity: v => { target.intensity = v },
    setSignalMix: v => { target.signalMix = v },

    /* Акцент сцены. Принимает три компонента 0–255 — те же, что
       лежат в данных направлений, чтобы источник цвета оставался
       один. Без аргумента возвращает исходный цвет темы. */
    setAccent(rgb) {
      target.cool = rgb
        ? rgb.map(n => Math.min(Math.max(Number(n) || 0, 0), 255) / 255)
        : baseCool.slice()
    },
    start,
    stop,
    destroy() {
      stop()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      const ext = gl.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    },
  }
}
