// Color estable por contenedor: mapa y lista alineados al ordenar o filtrar.
export function colorForContainer(containerNumber) {
  const s = String(containerNumber ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360} 72% 58%)`;
}
