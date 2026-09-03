#version 300 es
precision highp float;

/* ============================================================
   «Вычислительное поле»

   Рисуется не рой частиц, а изолинии скалярного поля —
   контурная карта функции f(x, y, t). Линия равного уровня
   это честный математический объект, а не декор: у поля есть
   плотность, направление и состояние, и всё это управляется
   снаружи.

     uDensity  — плотность изолиний. Растёт в калькуляторе
                 вместе с набранным объёмом работ в EP.
     uProgress — положение по странице: меняет характер
                 искажения от секции к секции.
     uMouse    — локальное возмущение под курсором.

   Стоимость: два треугольника. Ни одной частицы, ни одной
   вершины сверх этого — вся картинка живёт в шейдере.
   ============================================================ */

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uDensity;
uniform float uProgress;
uniform float uIntensity;
uniform vec3  uCool;
uniform vec3  uSignal;
uniform float uSignalMix;

in  vec2 vUv;
out vec4 fragColor;

/* --- Шум ------------------------------------------------------------- */

float hash(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

/* Градиентный шум: интерполяция по сглаженным весам даёт
   плавное поле без «блочности» value-шума. */
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/* Фрактальный шум: пять октав с поворотом между ними, чтобы
   не проступала сетка осей. */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02 + 0.037;
    a *= 0.5;
  }
  return v;
}

/* Доменное искажение: поле дважды искажает само себя.
   Отсюда берутся плавные потоки и завихрения — то, чего
   принципиально не может дать равномерная сетка точек. */
float field(vec2 p) {
  float t = uTime * 0.028;

  vec2 q = vec2(
    fbm(p + vec2(0.0, t)),
    fbm(p + vec2(5.2, 1.3) - t * 0.6)
  );

  vec2 r = vec2(
    fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.4)
  );

  /* Прогресс по странице подмешивается в искажение: поле
     не «переключается» между состояниями, а перетекает. */
  return fbm(p + (3.0 + uProgress * 1.6) * r);
}

void main() {
  /* Коррекция пропорций: поле не должно растягиваться
     на широких экранах. */
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5) * 2.4;

  /* Возмущение под курсором — поле реагирует на присутствие,
     но не гонится за мышью. */
  vec2 m = vec2((uMouse.x - 0.5) * aspect, uMouse.y - 0.5) * 2.4;
  float d = length(p - m);
  float pull = exp(-d * d * 2.2) * uMouseStrength;
  p += normalize(p - m + 1e-5) * pull * 0.22;

  float v = field(p);

  /* Изолинии. fwidth даёт ширину линии в экранных пикселях,
     поэтому толщина постоянна независимо от масштаба поля —
     без этого линии муарят на краях. */
  float scaled = v * uDensity;
  float w = fwidth(scaled);
  float band = abs(fract(scaled) - 0.5);
  float iso = 1.0 - smoothstep(0.0, w * 1.6, band);

  /* Гасим линии там, где поле меняется слишком быстро:
     иначе в местах сгущения появляется каша вместо линий. */
  iso *= smoothstep(0.55, 0.12, w);

  /* Второй, более редкий набор линий — «главные» уровни,
     как утолщённые горизонтали на топографической карте. */
  float majorScaled = v * uDensity * 0.25;
  float majorW = fwidth(majorScaled);
  float majorBand = abs(fract(majorScaled) - 0.5);
  float major = 1.0 - smoothstep(0.0, majorW * 2.0, majorBand);
  major *= smoothstep(0.55, 0.12, majorW);

  /* Виньетка: центр экрана отдан контенту, поле живёт по краям. */
  vec2 vc = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float vignette = smoothstep(0.22, 1.05, length(vc));

  float amount = (iso * 0.46 + major * 1.05) * uIntensity;
  amount *= mix(0.06, 1.0, vignette);

  /* Тёплый подмешивается только по команде снаружи —
     в калькуляторе, когда расчёт набран. */
  vec3 tint = mix(uCool, uSignal, uSignalMix * major);
  vec3 color = tint * amount;

  /* Дальнее свечение: поле не обрывается в пустоту,
     а тонет в фоне. */
  color += uCool * pow(max(v, 0.0), 3.0) * 0.06 * vignette;

  fragColor = vec4(color, amount * 0.9 + 0.02);
}
