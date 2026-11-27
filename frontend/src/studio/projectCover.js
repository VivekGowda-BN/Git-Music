// Pexels photographs (https://www.pexels.com/photo/<id>/), bundled locally.
const photoIds = [
  9419224,  // cottonbro studio — jazz ensemble
  3672355,  // Carlos Santos — illuminated synthesizers
  2675648,  // Andre Moura — night festival
  6864494,  // cottonbro studio — vinyl turntable
  35344302, // Manos Orfanos — live drummer
  12622097, // César Guillotel — studio control room
  92066,    // Markus Spiske — reel-to-reel deck
  14251576, // TStudio — patch cables
  167636,   // Thibault Trillet — band on stage
  8197361,  // RDNE Stock project — mixing console
  17570361, // Pexels User — São Paulo audience
  18467211, // Jonnathan Gonzalez — tape meters
];

export function projectCovers(projects) {
  const covers = new Map();
  // Assign older projects first so a new take or a search won't shuffle the shelf.
  const ordered = [...projects].sort((a,b) =>
    String(a.takes[0]?.created ?? '').localeCompare(String(b.takes[0]?.created ?? '')) ||
    a.id.localeCompare(b.id));
  let available = [];
  for (const project of ordered) {
    if (!available.length) available = [...photoIds];
    let index = 0;
    for (const char of project.id) index = (31*index + char.charCodeAt(0)) % available.length;
    const [photo] = available.splice(index,1);
    covers.set(project.id,`/art/projects/${photo}.jpg`);
  }
  return covers;
}
