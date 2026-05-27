import { useEffect, useRef } from 'react';

export type GradientConfig = {
  baseColor: string;
  topColor: string;
  lavenderColor: string;
  creamColor: string;
  greenColor: string;
  speed: number;
  topY: number;
  topWidth: number;
  topHeight: number;
  topStrength: number;
  creamY: number;
  creamWidth: number;
  creamHeight: number;
  creamStrength: number;
  greenY: number;
  greenWidth: number;
  greenHeight: number;
  greenStrength: number;
  vignette: number;
  grain: number;
  arcTopY: number;
  arcTopRadiusX: number;
  arcTopRadiusY: number;
  arcBottomY: number;
  arcBottomRadiusX: number;
  arcBottomRadiusY: number;
  arcLineWidth: number;
  arcGlow: number;
  arcGapTint: number;
  arcDarkness: number;
};

export type GlassConfig = {
  alpha: number;
  blur: number;
  saturation: number;
  edgeGlow: number;
  topThickness: number;
  bottomThickness: number;
  sideThickness: number;
  darkDepth: number;
  refraction: number;
  bevelDepth: number;
  bevelWidth: number;
  frost: number;
  magnify: number;
  specular: number;
};

export type GradientVariant = 'option1' | 'option2' | 'option3' | 'option4' | 'option5' | 'option6';

export const defaultGradientConfig: GradientConfig = {
  baseColor: '#030406',
  topColor: '#2e5cf2',
  lavenderColor: '#b88cf2',
  creamColor: '#fdebd6',
  greenColor: '#0fdc4d',
  speed: 0.42,
  topY: 0.92,
  topWidth: 0.62,
  topHeight: 0.3,
  topStrength: 0.95,
  creamY: 0.5,
  creamWidth: 0.46,
  creamHeight: 0.2,
  creamStrength: 1.05,
  greenY: 0.16,
  greenWidth: 0.42,
  greenHeight: 0.2,
  greenStrength: 1.05,
  vignette: 0.22,
  grain: 0.016,
  arcTopY: 1.16,
  arcTopRadiusX: 0.66,
  arcTopRadiusY: 0.56,
  arcBottomY: -0.16,
  arcBottomRadiusX: 0.64,
  arcBottomRadiusY: 0.50,
  arcLineWidth: 0.015,
  arcGlow: 0.16,
  arcGapTint: 0.76,
  arcDarkness: 0.78,
};

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_corner_radius;
uniform float u_speed;
uniform vec3 u_base_color;
uniform vec3 u_top_color;
uniform vec3 u_lavender_color;
uniform vec3 u_cream_color;
uniform vec3 u_green_color;
uniform float u_top_y;
uniform float u_top_width;
uniform float u_top_height;
uniform float u_top_strength;
uniform float u_cream_y;
uniform float u_cream_width;
uniform float u_cream_height;
uniform float u_cream_strength;
uniform float u_green_y;
uniform float u_green_width;
uniform float u_green_height;
uniform float u_green_strength;
uniform float u_vignette_strength;
uniform float u_grain_strength;
uniform float u_arc_top_y;
uniform float u_arc_top_radius_x;
uniform float u_arc_top_radius_y;
uniform float u_arc_bottom_y;
uniform float u_arc_bottom_radius_x;
uniform float u_arc_bottom_radius_y;
uniform float u_arc_line_width;
uniform float u_arc_glow;
uniform float u_arc_gap_tint;
uniform float u_arc_darkness;
uniform float u_glass_alpha;
uniform float u_glass_blur;
uniform float u_glass_saturation;
uniform float u_glass_edge_glow;
uniform float u_glass_top_thickness;
uniform float u_glass_bottom_thickness;
uniform float u_glass_side_thickness;
uniform float u_glass_dark_depth;
uniform float u_glass_refraction;
uniform float u_glass_bevel_depth;
uniform float u_glass_bevel_width;
uniform float u_glass_frost;
uniform float u_glass_magnify;
uniform float u_glass_specular;
uniform float u_variant;
varying vec2 v_uv;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float roundedBoxPx(vec2 px, vec2 size, float r) {
  vec2 q = abs(px - size * 0.5) - (size * 0.5 - vec2(r));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float edgeBlurPx(vec2 px, vec2 size, float r, float spread) {
  float d = -roundedBoxPx(px, size, r);
  return 1.0 - smoothstep(0.0, spread, d);
}

float blob(vec2 uv, vec2 center, vec2 radius, float softness) {
  vec2 p = (uv - center) / radius;
  return exp(-dot(p, p) * softness);
}

float blurcle(vec2 uv, vec2 center, vec2 size, float power, float blur) {
  vec2 q = abs((uv - center) / size);
  float d = pow(pow(q.x, power) + pow(q.y, power), 1.0 / power);
  return 1.0 - smoothstep(1.0 - blur, 1.0 + blur, d);
}

float sphole(vec2 uv, vec2 center, vec2 radius, float blur) {
  vec2 q = (uv - center) / radius;
  float d = length(q);
  float body = 1.0 - smoothstep(1.0 - blur, 1.0 + blur, d);
  float crown = exp(-pow(d - 0.52, 2.0) * 8.0);
  float hollow = exp(-d * d * 3.6);
  return clamp(body * 0.72 + crown * 0.34 - hollow * 0.08, 0.0, 1.0);
}

float organicBlob(vec2 uv, vec2 center, vec2 radius, float softness, float warp, float phase) {
  vec2 q = (uv - center) / radius;
  float a = atan(q.y, q.x);
  float d = length(q);
  float contour = 1.0 +
    sin(a * 2.0 + phase) * warp * 0.22 +
    sin(a * 3.0 - phase * 0.7) * warp * 0.16 +
    sin(a * 5.0 + phase * 1.3) * warp * 0.08;
  return exp(-pow(d / max(contour, 0.28), 2.0) * softness);
}

float organicEdge(vec2 uv, vec2 center, vec2 radius, float width, float warp, float phase) {
  vec2 q = (uv - center) / radius;
  float a = atan(q.y, q.x);
  float d = length(q);
  float contour = 1.0 +
    sin(a * 2.0 + phase) * warp * 0.22 +
    sin(a * 3.0 - phase * 0.7) * warp * 0.16 +
    sin(a * 5.0 + phase * 1.3) * warp * 0.08;
  return exp(-pow((d - contour) / width, 2.0));
}

float ellipseSdf(vec2 uv, vec2 center, vec2 radius) {
  vec2 q = (uv - center) / radius;
  return length(q) - 1.0;
}

vec3 mixAdd(vec3 base, vec3 color, float amount) {
  return mix(base, color, clamp(amount, 0.0, 1.0));
}

vec3 fieldColor(vec2 uv, float t) {
  vec2 p = uv * 2.0 - 1.0;
  vec2 aspectP = vec2(p.x * (u_resolution.x / u_resolution.y), p.y);

  // Base: near-black with slight cool tint
  vec3 color = u_base_color;

  // ---------- TOP: deep blue sweep (covers ~upper third) ----------
  vec2 topDrift = vec2(sin(t * 0.95) * 0.080, cos(t * 0.74) * 0.048);
  float blueWide = max(
    blurcle(uv, vec2(0.50, u_top_y) + topDrift, vec2(u_top_width + sin(t * 0.69) * 0.060, u_top_height + cos(t * 0.83) * 0.040), 3.6, 0.55),
    blob(uv, vec2(0.50 + sin(t * 1.12) * 0.075, u_top_y + 0.03 + cos(t * 0.78) * 0.036), vec2(u_top_width * 0.89, u_top_height * 0.73), 0.55)
  );
  color = mixAdd(color, u_top_color, blueWide * u_top_strength);

  // Side blue lobes pushing color down to ~0.75
  float blueLeft  = blob(uv, vec2(0.04 + sin(t * 0.86) * 0.055, 0.80 + cos(t * 1.05) * 0.085),       vec2(0.22, 0.32 + sin(t * 0.64) * 0.060), 0.65);
  float blueRight = blob(uv, vec2(0.96 + cos(t * 0.91) * 0.055, 0.80 + sin(t * 1.30) * 0.085), vec2(0.22, 0.32 + cos(t * 0.73) * 0.060), 0.65);
  color = mixAdd(color, u_top_color, (blueLeft + blueRight) * 0.85);

  // ---------- UPPER-MIDDLE: lavender / purple ----------
  vec2 lavenderDrift = vec2(sin(t * 0.77 + 1.4) * 0.080, cos(t * 0.67 + 0.6) * 0.060);
  float lavender = max(
    blurcle(uv, vec2(0.50, 0.72) + lavenderDrift, vec2(0.52 + sin(t * 0.61) * 0.070, 0.22 + cos(t * 0.72) * 0.045), 3.4, 0.55),
    sphole(uv, vec2(0.49 + cos(t * 1.00) * 0.080, 0.70 + sin(t * 0.84) * 0.055), vec2(0.46, 0.20), 0.58) * 0.80
  );
  color = mixAdd(color, u_lavender_color, lavender * 0.85);

  // Soft pink ring just below lavender (transition to cream)
  float pinkBand = blurcle(uv, vec2(0.50 + sin(t * 0.55) * 0.060, 0.60 + cos(t * 0.68) * 0.040), vec2(0.55, 0.12 + sin(t * 0.66) * 0.035), 3.0, 0.60);
  color = mixAdd(color, vec3(0.98, 0.72, 0.78), pinkBand * 0.55);

  // ---------- CENTER: large warm cream/peach glow ----------
  vec2 creamDrift = vec2(sin(t * 0.59 + 0.8) * 0.080, cos(t * 0.65) * 0.055);
  float creamCore = max(
    blob(uv, vec2(0.50, u_cream_y) + creamDrift, vec2(u_cream_width * 0.83 + sin(t * 0.51) * 0.060, u_cream_height + cos(t * 0.57) * 0.040), 0.85),
    blurcle(uv, vec2(0.50 + cos(t * 0.52) * 0.065, u_cream_y + sin(t * 0.56) * 0.050), vec2(u_cream_width + sin(t * 0.48) * 0.080, u_cream_height + cos(t * 0.53) * 0.038), 3.0, 0.60) * 0.85
  );
  color = mixAdd(color, u_cream_color, creamCore * u_cream_strength);

  float peachWide = blurcle(uv, vec2(0.50 + sin(t * 0.62) * 0.075, 0.46 + cos(t * 0.59) * 0.050), vec2(0.55 + sin(t * 0.47) * 0.070, 0.16), 2.8, 0.65) * 0.70;
  color = mixAdd(color, vec3(0.99, 0.78, 0.66), peachWide * 0.55);

  // ---------- LOWER-MIDDLE: dark green valley ----------
  float valleyCurve = 0.34 + 0.060 * exp(-p.x * p.x * 1.6);
  float darkBand = smoothstep(valleyCurve + 0.16, valleyCurve - 0.12, uv.y) * smoothstep(0.02, 0.28, uv.y);
  color = mix(color, vec3(0.005, 0.040, 0.030), darkBand * 0.78);

  // ---------- BOTTOM: vivid green dome ----------
  vec2 greenDrift = vec2(sin(t * 0.72 + 2.1) * 0.090, cos(t * 0.63 + 0.7) * 0.065);
  float greenCore = max(
    blob(uv, vec2(0.50, u_green_y) + greenDrift, vec2(u_green_width + sin(t * 0.54) * 0.080, u_green_height + cos(t * 0.58) * 0.055), 0.75),
    sphole(uv, vec2(0.50 + cos(t * 0.66) * 0.075, u_green_y - 0.02 + sin(t * 0.60) * 0.050), vec2(u_green_width, u_green_height), 0.50) * 0.85
  );
  color = mixAdd(color, u_green_color, greenCore * u_green_strength);

  // Bottom bright fringe
  float greenFringe = blob(uv, vec2(0.50 + sin(t * 0.50) * 0.075, 0.06), vec2(0.50 + cos(t * 0.53) * 0.070, 0.10), 0.55);
  color = mixAdd(color, vec3(0.55, 1.0, 0.45), greenFringe * 0.55);

  // Side shading at bottom corners
  float lowerSideShadow = (
    blob(uv, vec2(0.04, 0.22), vec2(0.16, 0.32), 0.60) +
    blob(uv, vec2(0.96, 0.22), vec2(0.16, 0.32), 0.60)
  ) * smoothstep(0.55, 0.08, uv.y);
  color = mix(color, vec3(0.005, 0.050, 0.040), lowerSideShadow * 0.50);

  // Subtle vignette
  float vignette = smoothstep(0.55, 1.15, length(p * vec2(0.78, 0.92)));
  color *= 1.0 - vignette * u_vignette_strength;

  // Film grain
  color += (fract(sin(dot(uv * u_resolution + u_time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_grain_strength;
  return color;
}

vec3 recolorField(vec2 uv, float t, float paletteId) {
  vec2 p = uv * 2.0 - 1.0;
  vec3 shape = fieldColor(uv, t);
  float energy = clamp(dot(shape, vec3(0.299, 0.587, 0.114)) * 1.72, 0.0, 1.0);
  float glow = smoothstep(0.01, 0.62, energy);
  float top = smoothstep(0.58, 0.94, uv.y);
  float mid = exp(-pow((uv.y - 0.52) / 0.22, 2.0));
  float bottom = smoothstep(0.44, 0.05, uv.y);
  float center = exp(-pow(p.x / 0.38, 2.0));
  float roundCenter = exp(-dot(vec2(p.x / 0.46, (uv.y - 0.52) / 0.30), vec2(p.x / 0.46, (uv.y - 0.52) / 0.30)));
  float tightCenter = exp(-dot(vec2(p.x / 0.34, (uv.y - 0.52) / 0.22), vec2(p.x / 0.34, (uv.y - 0.52) / 0.22)));
  vec2 pixelUv = uv * u_resolution;
  float minSide = min(u_resolution.x, u_resolution.y);
  float optionThreeTopDistance = length(pixelUv - vec2(0.50, 0.58) * u_resolution) / minSide;
  float optionThreeBottomDistance = length(pixelUv - vec2(0.50, 0.46) * u_resolution) / minSide;
  float optionThreeNeck = exp(-pow(p.x / 0.18, 2.0)) * exp(-pow((uv.y - 0.52) / 0.070, 2.0));
  float optionThreeVerticalPull = exp(-pow(p.x / 0.48, 2.0)) * (
    exp(-pow((uv.y - 0.76) / 0.32, 2.0)) +
    exp(-pow((uv.y - 0.28) / 0.32, 2.0))
  );
  float optionThreeSideField = exp(-pow((abs(p.x) - 0.42) / 0.26, 2.0)) * exp(-pow((uv.y - 0.52) / 0.26, 2.0));
  float optionThreeOuterBloom = exp(-pow(p.x / 0.72, 2.0)) * (
    exp(-pow((uv.y - 0.86) / 0.26, 2.0)) +
    exp(-pow((uv.y - 0.18) / 0.26, 2.0))
  );
  float optionThreeCenter = max(
    1.0 - smoothstep(0.17, 0.34, optionThreeTopDistance),
    1.0 - smoothstep(0.17, 0.34, optionThreeBottomDistance)
  );
  float optionThreeAura = max(
    1.0 - smoothstep(0.24, 0.54, optionThreeTopDistance + sin(p.x * 5.0 + t * 0.55) * 0.014),
    1.0 - smoothstep(0.24, 0.54, optionThreeBottomDistance + cos(p.y * 4.0 - t * 0.36) * 0.014)
  );
  float side = exp(-pow((abs(p.x) - 0.72) / 0.18, 2.0));
  float upperSide = side * smoothstep(0.48, 0.88, uv.y);
  float lowerSide = side * smoothstep(0.52, 0.10, uv.y);

  vec3 dark = vec3(0.018, 0.018, 0.018);
  vec3 palette = vec3(1.0);
  vec3 accent = vec3(1.0);
  float accentMix = 0.0;

  if (paletteId < 0.5) {
    dark = vec3(0.030, 0.010, 0.006);
    palette = mix(vec3(1.0, 0.10, 0.02), vec3(1.0, 0.46, 0.10), smoothstep(0.10, 0.48, uv.y));
    palette = mix(palette, vec3(0.08, 0.010, 0.020), top * 0.86);
    palette = mix(palette, vec3(1.0, 0.78, 0.48), bottom * center * 0.54);
    accent = vec3(1.0, 0.92, 0.64);
    accentMix = lowerSide * 0.42;
  } else if (paletteId < 1.5) {
    float topD = length(pixelUv - vec2(0.50, 0.66) * u_resolution) / minSide;
    float bottomD = length(pixelUv - vec2(0.50, 0.38) * u_resolution) / minSide;
    float topDisc = 1.0 - smoothstep(0.38, 0.52, topD);
    float bottomDisc = 1.0 - smoothstep(0.38, 0.52, bottomD);
    float topRim = exp(-pow((topD - 0.43) / 0.055, 2.0));
    float bottomRim = exp(-pow((bottomD - 0.43) / 0.055, 2.0));
    float discs = max(topDisc, bottomDisc);
    float discAura = max(
      1.0 - smoothstep(0.44, 0.78, topD),
      1.0 - smoothstep(0.44, 0.78, bottomD)
    );
    float neck = exp(-pow((uv.y - 0.52) / 0.050, 2.0)) * exp(-pow(p.x / 0.92, 2.0));
    float sideCompression = exp(-pow((abs(p.x) - 0.58) / 0.24, 2.0)) * exp(-pow((uv.y - 0.52) / 0.20, 2.0));
    float verticalWash = exp(-pow(p.x / 0.62, 2.0)) * (
      exp(-pow((uv.y - 0.88) / 0.30, 2.0)) +
      exp(-pow((uv.y - 0.14) / 0.30, 2.0))
    );

    vec3 color = mix(vec3(0.018, 0.020, 0.006), vec3(0.58, 0.96, 0.05), verticalWash * 0.72);
    color = mixAdd(color, vec3(0.80, 1.0, 0.06), discAura * 0.62);
    color = mix(color, vec3(0.86, 1.0, 0.10), discs);
    color = mix(color, vec3(0.36, 0.12, 0.92), (topDisc * smoothstep(0.76, 0.46, uv.y) + bottomDisc * smoothstep(0.24, 0.54, uv.y)) * 0.46);
    color = mixAdd(color, vec3(0.54, 0.18, 1.0), (topRim + bottomRim) * 0.24);
    color = mix(color, vec3(0.010, 0.006, 0.030), neck * 0.92 + sideCompression * 0.58);
    float vignette = smoothstep(0.58, 1.18, length(p * vec2(0.80, 0.92)));
    color *= 1.0 - vignette * u_vignette_strength;
    color += (fract(sin(dot(uv * u_resolution + u_time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_grain_strength;
    return color;
  } else if (paletteId < 2.5) {
    dark = vec3(0.000, 0.018, 0.008);
    palette = mix(vec3(0.00, 0.05, 0.018), vec3(0.10, 1.0, 0.32), glow);
    palette = mix(palette, vec3(0.70, 1.0, 0.78), mid * center * 0.66);
    palette = mix(palette, vec3(0.00, 0.00, 0.00), top * 0.72 + bottom * 0.46);
    accent = vec3(0.46, 1.0, 0.18);
    accentMix = side * mid * 0.32;
  } else if (paletteId < 3.5) {
    dark = vec3(0.026, 0.006, 0.032);
    palette = mix(vec3(1.0, 0.20, 0.88), vec3(0.72, 0.16, 1.0), mid);
    palette = mix(palette, vec3(0.020, 0.004, 0.030), roundCenter * 0.78);
    palette = mix(palette, vec3(1.0, 0.64, 0.94), top * 0.52 + bottom * 0.44);
    accent = vec3(0.88, 0.54, 1.0);
    accentMix = side * glow * 0.34;
  } else {
    dark = vec3(0.006, 0.010, 0.045);
    palette = mix(vec3(0.14, 0.24, 1.0), vec3(1.0, 0.05, 0.48), top);
    palette = mix(palette, vec3(1.0, 0.98, 0.92), exp(-pow((uv.y - 0.46) / 0.11, 2.0)) * 0.78);
    palette = mix(palette, vec3(0.18, 0.08, 1.0), bottom * 0.68);
    accent = vec3(0.10, 0.88, 1.0);
    accentMix = side * (0.24 + mid * 0.22);
  }

  vec3 color = mix(dark, palette, glow);
  color = mixAdd(color, accent, accentMix);
  color *= 0.74 + glow * 0.48;
  float vignette = smoothstep(0.55, 1.15, length(p * vec2(0.78, 0.92)));
  color *= 1.0 - vignette * u_vignette_strength;
  color += (fract(sin(dot(uv * u_resolution + u_time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_grain_strength;
  return color;
}

vec3 optionTwoColor(vec2 uv, float t) { return recolorField(uv, t, 0.0); }
vec3 optionThreeColor(vec2 uv, float t) { return recolorField(uv, t, 1.0); }
vec3 optionFourColor(vec2 uv, float t) { return recolorField(uv, t, 2.0); }
vec3 optionFiveColor(vec2 uv, float t) { return recolorField(uv, t, 3.0); }
vec3 optionSixColor(vec2 uv, float t) { return recolorField(uv, t, 4.0); }

vec3 variantColor(vec2 uv, float t) {
  if (u_variant < 0.5) return fieldColor(uv, t);
  if (u_variant < 1.5) return optionTwoColor(uv, t);
  if (u_variant < 2.5) return optionThreeColor(uv, t);
  if (u_variant < 3.5) return optionFourColor(uv, t);
  if (u_variant < 4.5) return optionFiveColor(uv, t);
  return optionSixColor(uv, t);
}

void main() {
  vec2 uv = v_uv;
  vec2 px = uv * u_resolution;
  float t = u_time * u_speed;
  float minSide = min(u_resolution.x, u_resolution.y);
  float topWeight = smoothstep(0.62, 1.0, uv.y) * u_glass_top_thickness;
  float bottomWeight = smoothstep(0.38, 0.0, uv.y) * u_glass_bottom_thickness;
  float sideWeight = (smoothstep(0.28, 0.0, uv.x) + smoothstep(0.72, 1.0, uv.x)) * u_glass_side_thickness;
  float capRoundness = max(max(u_glass_top_thickness, u_glass_bottom_thickness) - 1.0, 0.0);
  float glassRadius = min(minSide * 0.48, u_corner_radius + capRoundness * u_glass_bevel_width * minSide * 2.4);
  float sdf = roundedBoxPx(px, u_resolution, glassRadius);
  float insideDistance = -sdf;
  float dpx = roundedBoxPx(px + vec2(1.0, 0.0), u_resolution, glassRadius) -
    roundedBoxPx(px - vec2(1.0, 0.0), u_resolution, glassRadius);
  float dpy = roundedBoxPx(px + vec2(0.0, 1.0), u_resolution, glassRadius) -
    roundedBoxPx(px - vec2(0.0, 1.0), u_resolution, glassRadius);
  vec2 normal = normalize(vec2(dpx, dpy) + vec2(0.0001));
  float capThickness = max(topWeight, bottomWeight);
  float directionalThickness = max(sideWeight * 0.55, capThickness);
  float bevelWidthPx = max(8.0, u_glass_bevel_width * minSide * (0.45 + directionalThickness * 2.8));
  float edge = 1.0 - smoothstep(0.0, bevelWidthPx, insideDistance);
  float tightEdge = 1.0 - smoothstep(0.0, bevelWidthPx * 0.32, insideDistance);
  float thickness = 0.65 + topWeight * 0.42 + bottomWeight * 0.56 + sideWeight * 0.28;
  float bevel = pow(edge, 1.35) * u_glass_bevel_depth * thickness;
  float refractionPx = (u_glass_refraction * minSide * 0.18 + bevel * minSide * 0.22);
  vec2 magnifyUv = (uv - 0.5) / max(u_glass_magnify, 0.001) + 0.5;
  vec2 refractUv = clamp(magnifyUv - normal * refractionPx / u_resolution, 0.0, 1.0);

  vec3 base = variantColor(uv, t);
  vec3 refracted = variantColor(refractUv, t);
  float r = edge * (u_glass_frost / minSide + mix(0.002, 0.020, clamp(u_glass_blur / 32.0, 0.0, 1.0)));
  vec3 softRefract =
    refracted * 0.46 +
    variantColor(clamp(refractUv + vec2(r, 0.0), 0.0, 1.0), t) * 0.12 +
    variantColor(clamp(refractUv - vec2(r, 0.0), 0.0, 1.0), t) * 0.12 +
    variantColor(clamp(refractUv + vec2(0.0, r), 0.0, 1.0), t) * 0.10 +
    variantColor(clamp(refractUv - vec2(0.0, r), 0.0, 1.0), t) * 0.10 +
    variantColor(clamp(refractUv + vec2(r * 0.7, r * 0.7), 0.0, 1.0), t) * 0.05 +
    variantColor(clamp(refractUv - vec2(r * 0.7, r * 0.7), 0.0, 1.0), t) * 0.05;

  vec3 color = mix(base, softRefract, clamp(edge * (0.22 + u_glass_alpha / 45.0 + u_glass_refraction * 2.2), 0.0, 0.92));
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, u_glass_saturation / 150.0);

  vec3 lightColor = mix(vec3(0.88, 0.96, 1.0), vec3(0.98, 1.0, 0.90), smoothstep(0.55, 0.05, uv.y));
  lightColor = mix(lightColor, vec3(1.0, 1.0, 0.96), topWeight);
  lightColor = mix(lightColor, vec3(0.98, 1.0, 0.84), bottomWeight);
  float specular = pow(tightEdge, 1.55) * u_glass_edge_glow * u_glass_specular * (0.28 + topWeight * 0.38 + bottomWeight * 0.48 + sideWeight * 0.22);
  float innerGlow = exp(-pow((insideDistance - bevelWidthPx * 0.34) / max(bevelWidthPx * 0.42, 1.0), 2.0)) * edge * u_glass_edge_glow * u_glass_bevel_depth;
  color = mix(color, lightColor, clamp(specular * 0.62 + innerGlow * 0.26, 0.0, 0.82));
  float occlusion = exp(-pow((insideDistance - 76.0) / 82.0, 2.0)) * edge * u_glass_dark_depth;
  color *= 1.0 - occlusion * (0.10 + bottomWeight * 0.12);
  color += lightColor * tightEdge * (topWeight * 0.13 + bottomWeight * 0.17 + sideWeight * 0.06);

  gl_FragColor = vec4(color, 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create shader.');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log ?? 'Shader compilation failed.');
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error('Unable to create WebGL program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log ?? 'WebGL program linking failed.');
  }

  return program;
}

type WebGLGradientProps = {
  config: GradientConfig;
  glass: GlassConfig;
  variant: GradientVariant;
};

export function WebGLGradient({ config, glass, variant }: WebGLGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);
  const glassRef = useRef(glass);
  const variantRef = useRef(variant);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    glassRef.current = glass;
  }, [glass]);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    });

    if (!gl) return;

    const program = createProgram(gl);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const cornerRadiusLocation = gl.getUniformLocation(program, 'u_corner_radius');
    const uniforms = {
      speed: gl.getUniformLocation(program, 'u_speed'),
      baseColor: gl.getUniformLocation(program, 'u_base_color'),
      topColor: gl.getUniformLocation(program, 'u_top_color'),
      lavenderColor: gl.getUniformLocation(program, 'u_lavender_color'),
      creamColor: gl.getUniformLocation(program, 'u_cream_color'),
      greenColor: gl.getUniformLocation(program, 'u_green_color'),
      topY: gl.getUniformLocation(program, 'u_top_y'),
      topWidth: gl.getUniformLocation(program, 'u_top_width'),
      topHeight: gl.getUniformLocation(program, 'u_top_height'),
      topStrength: gl.getUniformLocation(program, 'u_top_strength'),
      creamY: gl.getUniformLocation(program, 'u_cream_y'),
      creamWidth: gl.getUniformLocation(program, 'u_cream_width'),
      creamHeight: gl.getUniformLocation(program, 'u_cream_height'),
      creamStrength: gl.getUniformLocation(program, 'u_cream_strength'),
      greenY: gl.getUniformLocation(program, 'u_green_y'),
      greenWidth: gl.getUniformLocation(program, 'u_green_width'),
      greenHeight: gl.getUniformLocation(program, 'u_green_height'),
      greenStrength: gl.getUniformLocation(program, 'u_green_strength'),
      vignette: gl.getUniformLocation(program, 'u_vignette_strength'),
      grain: gl.getUniformLocation(program, 'u_grain_strength'),
      arcTopY: gl.getUniformLocation(program, 'u_arc_top_y'),
      arcTopRadiusX: gl.getUniformLocation(program, 'u_arc_top_radius_x'),
      arcTopRadiusY: gl.getUniformLocation(program, 'u_arc_top_radius_y'),
      arcBottomY: gl.getUniformLocation(program, 'u_arc_bottom_y'),
      arcBottomRadiusX: gl.getUniformLocation(program, 'u_arc_bottom_radius_x'),
      arcBottomRadiusY: gl.getUniformLocation(program, 'u_arc_bottom_radius_y'),
      arcLineWidth: gl.getUniformLocation(program, 'u_arc_line_width'),
      arcGlow: gl.getUniformLocation(program, 'u_arc_glow'),
      arcGapTint: gl.getUniformLocation(program, 'u_arc_gap_tint'),
      arcDarkness: gl.getUniformLocation(program, 'u_arc_darkness'),
      glassAlpha: gl.getUniformLocation(program, 'u_glass_alpha'),
      glassBlur: gl.getUniformLocation(program, 'u_glass_blur'),
      glassSaturation: gl.getUniformLocation(program, 'u_glass_saturation'),
      glassEdgeGlow: gl.getUniformLocation(program, 'u_glass_edge_glow'),
      glassTopThickness: gl.getUniformLocation(program, 'u_glass_top_thickness'),
      glassBottomThickness: gl.getUniformLocation(program, 'u_glass_bottom_thickness'),
      glassSideThickness: gl.getUniformLocation(program, 'u_glass_side_thickness'),
      glassDarkDepth: gl.getUniformLocation(program, 'u_glass_dark_depth'),
      glassRefraction: gl.getUniformLocation(program, 'u_glass_refraction'),
      glassBevelDepth: gl.getUniformLocation(program, 'u_glass_bevel_depth'),
      glassBevelWidth: gl.getUniformLocation(program, 'u_glass_bevel_width'),
      glassFrost: gl.getUniformLocation(program, 'u_glass_frost'),
      glassMagnify: gl.getUniformLocation(program, 'u_glass_magnify'),
      glassSpecular: gl.getUniformLocation(program, 'u_glass_specular'),
      variant: gl.getUniformLocation(program, 'u_variant'),
    };
    const buffer = gl.createBuffer();
    let animationFrame = 0;
    const start = performance.now();
    let pixelRatio = 1;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      pixelRatio = dpr;
      const displayWidth = Math.max(1, Math.floor(width * dpr));
      const displayHeight = Math.max(1, Math.floor(height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, displayWidth, displayHeight);
    };

    const render = () => {
      resize();
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (performance.now() - start) / 1000);
      const parent = canvas.parentElement;
      const radius = parent ? parseFloat(getComputedStyle(parent).borderTopLeftRadius) : 36;
      gl.uniform1f(cornerRadiusLocation, radius * pixelRatio);
      const current = configRef.current;
      const baseColor = hexToRgb(current.baseColor);
      const topColor = hexToRgb(current.topColor);
      const lavenderColor = hexToRgb(current.lavenderColor);
      const creamColor = hexToRgb(current.creamColor);
      const greenColor = hexToRgb(current.greenColor);
      gl.uniform1f(uniforms.speed, current.speed);
      gl.uniform3f(uniforms.baseColor, baseColor[0], baseColor[1], baseColor[2]);
      gl.uniform3f(uniforms.topColor, topColor[0], topColor[1], topColor[2]);
      gl.uniform3f(uniforms.lavenderColor, lavenderColor[0], lavenderColor[1], lavenderColor[2]);
      gl.uniform3f(uniforms.creamColor, creamColor[0], creamColor[1], creamColor[2]);
      gl.uniform3f(uniforms.greenColor, greenColor[0], greenColor[1], greenColor[2]);
      gl.uniform1f(uniforms.topY, current.topY);
      gl.uniform1f(uniforms.topWidth, current.topWidth);
      gl.uniform1f(uniforms.topHeight, current.topHeight);
      gl.uniform1f(uniforms.topStrength, current.topStrength);
      gl.uniform1f(uniforms.creamY, current.creamY);
      gl.uniform1f(uniforms.creamWidth, current.creamWidth);
      gl.uniform1f(uniforms.creamHeight, current.creamHeight);
      gl.uniform1f(uniforms.creamStrength, current.creamStrength);
      gl.uniform1f(uniforms.greenY, current.greenY);
      gl.uniform1f(uniforms.greenWidth, current.greenWidth);
      gl.uniform1f(uniforms.greenHeight, current.greenHeight);
      gl.uniform1f(uniforms.greenStrength, current.greenStrength);
      gl.uniform1f(uniforms.vignette, current.vignette);
      gl.uniform1f(uniforms.grain, current.grain);
      gl.uniform1f(uniforms.arcTopY, current.arcTopY);
      gl.uniform1f(uniforms.arcTopRadiusX, current.arcTopRadiusX);
      gl.uniform1f(uniforms.arcTopRadiusY, current.arcTopRadiusY);
      gl.uniform1f(uniforms.arcBottomY, current.arcBottomY);
      gl.uniform1f(uniforms.arcBottomRadiusX, current.arcBottomRadiusX);
      gl.uniform1f(uniforms.arcBottomRadiusY, current.arcBottomRadiusY);
      gl.uniform1f(uniforms.arcLineWidth, current.arcLineWidth);
      gl.uniform1f(uniforms.arcGlow, current.arcGlow);
      gl.uniform1f(uniforms.arcGapTint, current.arcGapTint);
      gl.uniform1f(uniforms.arcDarkness, current.arcDarkness);
      const currentGlass = glassRef.current;
      gl.uniform1f(uniforms.glassAlpha, currentGlass.alpha);
      gl.uniform1f(uniforms.glassBlur, currentGlass.blur);
      gl.uniform1f(uniforms.glassSaturation, currentGlass.saturation);
      gl.uniform1f(uniforms.glassEdgeGlow, currentGlass.edgeGlow);
      gl.uniform1f(uniforms.glassTopThickness, currentGlass.topThickness);
      gl.uniform1f(uniforms.glassBottomThickness, currentGlass.bottomThickness);
      gl.uniform1f(uniforms.glassSideThickness, currentGlass.sideThickness);
      gl.uniform1f(uniforms.glassDarkDepth, currentGlass.darkDepth);
      gl.uniform1f(uniforms.glassRefraction, currentGlass.refraction);
      gl.uniform1f(uniforms.glassBevelDepth, currentGlass.bevelDepth);
      gl.uniform1f(uniforms.glassBevelWidth, currentGlass.bevelWidth);
      gl.uniform1f(uniforms.glassFrost, currentGlass.frost);
      gl.uniform1f(uniforms.glassMagnify, currentGlass.magnify);
      gl.uniform1f(uniforms.glassSpecular, currentGlass.specular);
      const variantValue =
        variantRef.current === 'option1'
          ? 0
          : variantRef.current === 'option2'
            ? 1
            : variantRef.current === 'option3'
              ? 2
              : variantRef.current === 'option4'
                ? 3
                : variantRef.current === 'option5'
                  ? 4
                  : 5;
      gl.uniform1f(uniforms.variant, variantValue);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="gradient-canvas" />;
}
