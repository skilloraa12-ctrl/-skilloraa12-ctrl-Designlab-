// Pure helpers for Component Lab: given a small config, compute the plain
// style object for each state of a component (default/hover/focus/active/
// disabled) so the UI can render every state side by side as a static
// "contact sheet" — plus the real exportable CSS using actual pseudo-classes.

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('')
}
export function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex)
  const f = amt < 0 ? 0 : 255
  const p = Math.abs(amt)
  return rgbToHex({ r: r + (f - r) * p, g: g + (f - g) * p, b: b + (f - b) * p })
}
export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const BUTTON_SIZES = {
  sm: { padding: '6px 14px', fontSize: 13 },
  md: { padding: '10px 20px', fontSize: 14 },
  lg: { padding: '13px 26px', fontSize: 16 },
}
export const BUTTON_STATES = ['default', 'hover', 'focus', 'active', 'disabled']

export function buttonStyle(cfg, state) {
  const size = BUTTON_SIZES[cfg.size]
  const base = {
    background: cfg.bg, color: cfg.color, borderRadius: cfg.radius, border: 'none',
    padding: size.padding, fontSize: size.fontSize, fontWeight: 600, cursor: 'pointer',
    boxShadow: 'none', transform: 'none', opacity: 1, outline: 'none', transition: 'none',
  }
  if (state === 'hover') base.background = shade(cfg.bg, -0.12)
  if (state === 'focus') base.boxShadow = `0 0 0 3px ${hexToRgba(cfg.bg, 0.35)}`
  if (state === 'active') { base.background = shade(cfg.bg, -0.22); base.transform = 'scale(0.97)' }
  if (state === 'disabled') { base.opacity = 0.45; base.cursor = 'not-allowed' }
  return base
}

export function buttonCss(cfg) {
  const size = BUTTON_SIZES[cfg.size]
  return [
    `.btn {`,
    `  background: ${cfg.bg};`,
    `  color: ${cfg.color};`,
    `  border-radius: ${cfg.radius}px;`,
    `  border: none;`,
    `  padding: ${size.padding};`,
    `  font-size: ${size.fontSize}px;`,
    `  font-weight: 600;`,
    `  cursor: pointer;`,
    `}`,
    `.btn:hover { background: ${shade(cfg.bg, -0.12)}; }`,
    `.btn:focus-visible { box-shadow: 0 0 0 3px ${hexToRgba(cfg.bg, 0.35)}; outline: none; }`,
    `.btn:active { background: ${shade(cfg.bg, -0.22)}; transform: scale(0.97); }`,
    `.btn:disabled { opacity: 0.45; cursor: not-allowed; }`,
  ].join('\n')
}

export const INPUT_STATES = ['default', 'hover', 'focus', 'filled', 'disabled']

export function inputStyle(cfg, state) {
  const base = {
    border: `${cfg.borderWidth}px solid #C9C9D1`, borderRadius: cfg.radius, padding: '9px 12px',
    fontSize: 14, background: '#FFFFFF', color: '#17171A', boxShadow: 'none', outline: 'none',
  }
  if (state === 'hover') base.border = `${cfg.borderWidth}px solid #9D9DA8`
  if (state === 'focus') { base.border = `${cfg.borderWidth}px solid ${cfg.accent}`; base.boxShadow = `0 0 0 3px ${hexToRgba(cfg.accent, 0.2)}` }
  if (state === 'filled') base.border = `${cfg.borderWidth}px solid #9D9DA8`
  if (state === 'disabled') { base.background = '#F0F0F3'; base.color = '#9D9DA8'; base.cursor = 'not-allowed' }
  return base
}

export function inputCss(cfg) {
  return [
    `.input {`,
    `  border: ${cfg.borderWidth}px solid #C9C9D1;`,
    `  border-radius: ${cfg.radius}px;`,
    `  padding: 9px 12px;`,
    `  font-size: 14px;`,
    `}`,
    `.input:hover { border-color: #9D9DA8; }`,
    `.input:focus { border-color: ${cfg.accent}; box-shadow: 0 0 0 3px ${hexToRgba(cfg.accent, 0.2)}; outline: none; }`,
    `.input:disabled { background: #F0F0F3; color: #9D9DA8; cursor: not-allowed; }`,
  ].join('\n')
}

export const TOGGLE_STATES = ['off', 'on', 'hover', 'focus', 'disabled']

export function toggleStyle(cfg, state) {
  const w = 44, h = 24
  const track = { width: w, height: h, borderRadius: h / 2, background: '#C9C9D1', position: 'relative', boxShadow: 'none', opacity: 1 }
  const knob = { width: h - 4, height: h - 4, borderRadius: '50%', background: '#FFFFFF', position: 'absolute', top: 2, left: 2, transition: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }
  const on = state === 'on' || state === 'hover' || state === 'focus'
  if (on) { track.background = cfg.accent; knob.left = w - (h - 2) }
  if (state === 'hover') track.background = shade(cfg.accent, -0.1)
  if (state === 'focus') track.boxShadow = `0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}`
  if (state === 'disabled') track.opacity = 0.45
  return { track, knob }
}

export function toggleCss(cfg) {
  return [
    `.toggle { width: 44px; height: 24px; border-radius: 12px; background: #C9C9D1; position: relative; }`,
    `.toggle.on { background: ${cfg.accent}; }`,
    `.toggle:hover { background: ${shade(cfg.accent, -0.1)}; }`,
    `.toggle:focus-visible { box-shadow: 0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}; }`,
    `.toggle:disabled { opacity: 0.45; }`,
    `.toggle-knob { width: 20px; height: 20px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: left 0.15s; }`,
    `.toggle.on .toggle-knob { left: 22px; }`,
  ].join('\n')
}

export const BADGE_VARIANTS = [
  { key: 'default', label: 'Default', bg: '#E4E4EA', color: '#3A3A42' },
  { key: 'success', label: 'Success', bg: '#D7F2E3', color: '#146C43' },
  { key: 'warning', label: 'Warning', bg: '#FCECC8', color: '#8A5A00' },
  { key: 'error', label: 'Error', bg: '#FBDADA', color: '#B42318' },
]

export function badgeStyle(cfg, variant) {
  return {
    background: variant.bg, color: variant.color, borderRadius: cfg.pill ? 999 : cfg.radius,
    padding: '4px 11px', fontSize: 12, fontWeight: 600, display: 'inline-block',
  }
}

export function badgeCss(cfg) {
  const radius = cfg.pill ? '999px' : `${cfg.radius}px`
  return BADGE_VARIANTS.map((v) => [
    `.badge-${v.key} {`,
    `  background: ${v.bg};`,
    `  color: ${v.color};`,
    `  border-radius: ${radius};`,
    `  padding: 4px 11px;`,
    `  font-size: 12px;`,
    `  font-weight: 600;`,
    `}`,
  ].join('\n')).join('\n\n')
}

export const CARD_STATES = ['default', 'hover', 'focus', 'disabled']

export function cardStyle(cfg, state) {
  const base = {
    border: `1px solid #E4E4EA`, borderRadius: cfg.radius, background: '#FFFFFF',
    boxShadow: 'none', transform: 'none', opacity: 1, padding: 16,
  }
  if (state === 'hover') { base.boxShadow = '0 6px 16px rgba(20,20,25,0.12)'; base.transform = 'translateY(-2px)' }
  if (state === 'focus') base.boxShadow = `0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}`
  if (state === 'disabled') base.opacity = 0.5
  return base
}

export function cardCss(cfg) {
  return [
    `.card {`,
    `  border: 1px solid #E4E4EA;`,
    `  border-radius: ${cfg.radius}px;`,
    `  background: #fff;`,
    `  padding: 16px;`,
    `}`,
    `.card:hover { box-shadow: 0 6px 16px rgba(20,20,25,0.12); transform: translateY(-2px); }`,
    `.card:focus-visible { box-shadow: 0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}; }`,
    `.card.disabled { opacity: 0.5; }`,
  ].join('\n')
}

export const CHECK_STATES = ['default', 'hover', 'focus', 'checked', 'disabled']

export function checkboxStyle(cfg, state) {
  const checked = state === 'checked'
  const box = {
    width: 20, height: 20, borderRadius: 5, border: '2px solid #C9C9D1', background: '#FFFFFF',
    boxShadow: 'none', opacity: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  }
  if (checked) { box.background = cfg.accent; box.border = `2px solid ${cfg.accent}` }
  if (state === 'hover') box.border = `2px solid ${shade(cfg.accent, -0.1)}`
  if (state === 'focus') box.boxShadow = `0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}`
  if (state === 'disabled') box.opacity = 0.45
  return box
}

export function checkboxCss(cfg) {
  return [
    `.checkbox {`,
    `  width: 20px; height: 20px; border-radius: 5px;`,
    `  border: 2px solid #C9C9D1; background: #fff;`,
    `}`,
    `.checkbox:hover { border-color: ${shade(cfg.accent, -0.1)}; }`,
    `.checkbox:focus-visible { box-shadow: 0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}; }`,
    `.checkbox.checked { background: ${cfg.accent}; border-color: ${cfg.accent}; }`,
    `.checkbox:disabled { opacity: 0.45; }`,
  ].join('\n')
}

export function radioStyle(cfg, state) {
  const checked = state === 'checked'
  const ring = {
    width: 20, height: 20, borderRadius: '50%', border: '2px solid #C9C9D1', background: '#FFFFFF',
    boxShadow: 'none', opacity: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  }
  const dot = { width: 8, height: 8, borderRadius: '50%', background: checked ? cfg.accent : 'transparent' }
  if (checked) ring.border = `2px solid ${cfg.accent}`
  if (state === 'hover') ring.border = `2px solid ${shade(cfg.accent, -0.1)}`
  if (state === 'focus') ring.boxShadow = `0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}`
  if (state === 'disabled') ring.opacity = 0.45
  return { ring, dot }
}

export function radioCss(cfg) {
  return [
    `.radio {`,
    `  width: 20px; height: 20px; border-radius: 50%;`,
    `  border: 2px solid #C9C9D1; background: #fff;`,
    `  display: inline-flex; align-items: center; justify-content: center;`,
    `}`,
    `.radio:hover { border-color: ${shade(cfg.accent, -0.1)}; }`,
    `.radio:focus-visible { box-shadow: 0 0 0 3px ${hexToRgba(cfg.accent, 0.3)}; }`,
    `.radio.checked { border-color: ${cfg.accent}; }`,
    `.radio.checked::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: ${cfg.accent}; }`,
    `.radio:disabled { opacity: 0.45; }`,
  ].join('\n')
}
