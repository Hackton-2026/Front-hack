export const PROJECT_ICONS = [
  'fi-rr-hand-wave', 'fi-rr-rocket', 'fi-rr-bullseye', 'fi-rr-puzzle-alt', 'fi-rr-box', 'fi-rr-folder-open', 'fi-rr-tools', 'fi-rr-bulb',
  'fi-rr-chart-line-up', 'fi-rr-flame', 'fi-rr-star', 'fi-rr-seedling', 'fi-rr-flask', 'fi-rr-palette', 'fi-rr-megaphone', 'fi-rr-shopping-cart',
  'fi-rr-mobile-notch', 'fi-rr-laptop-code', 'fi-rr-lock', 'fi-rr-flag-checkered', 'fi-rr-check-circle', 'fi-rr-compass-alt', 'fi-rr-building', 'fi-rr-briefcase',
  'fi-rr-graduation-cap', 'fi-rr-heart', 'fi-rr-calendar', 'fi-rr-book-alt', 'fi-rr-users-alt', 'fi-rr-globe', 'fi-rr-shield-check', 'fi-rr-leaf',
  'fi-rr-home', 'fi-rr-map-marker', 'fi-rr-coffee', 'fi-rr-camera', 'fi-rr-music', 'fi-rr-gamepad', 'fi-rr-gym', 'fi-rr-plane-alt',
]

const FROM_EMOJI = {
  '👋': 'fi-rr-hand-wave', '🚀': 'fi-rr-rocket', '🎯': 'fi-rr-bullseye', '🧩': 'fi-rr-puzzle-alt', '📦': 'fi-rr-box', '🗂️': 'fi-rr-folder-open',
  '🛠️': 'fi-rr-tools', '💡': 'fi-rr-bulb', '📈': 'fi-rr-chart-line-up', '🔥': 'fi-rr-flame', '⭐': 'fi-rr-star', '🌱': 'fi-rr-seedling',
  '🧪': 'fi-rr-flask', '🎨': 'fi-rr-palette', '📣': 'fi-rr-megaphone', '🛒': 'fi-rr-shopping-cart', '📱': 'fi-rr-mobile-notch', '💻': 'fi-rr-laptop-code',
  '🔒': 'fi-rr-lock', '🏁': 'fi-rr-flag-checkered', '👇': 'fi-rr-arrow-down', '✅': 'fi-rr-check-circle', '🧭': 'fi-rr-compass-alt', '🏗️': 'fi-rr-building',
  '📁': 'fi-rr-folder-open',
}

export const iconClass = (icon) => (icon?.startsWith('fi-rr-') ? icon : FROM_EMOJI[icon] || '')
