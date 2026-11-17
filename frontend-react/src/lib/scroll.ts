export function scrollToSection(sectionId: string, delay = 80) {
  window.setTimeout(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, delay);
}

export function scrollToTop() {
  window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40);
}
