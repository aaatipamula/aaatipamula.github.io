export function scrollToSection(id: string) {
  const section = document.getElementById(`section-${id}`);
  const raw = document.getElementById(id);
  if (!section && !raw) {
    console.log(`Element with ID (${id}) not found`);
    return;
  } else if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  } else if (raw) {
    raw.scrollIntoView({ behavior: "smooth" });
  }
}

