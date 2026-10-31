export function safePublicUrl(value) {
  try { const url=new URL(value); return url.protocol==='https:' && !url.username && !url.password; } catch { return false; }
}
export const instructorEvidence = i => JSON.stringify([i.id,i.name,i.bio||'',i.photo_url||i.photo||'']);
const text = value => typeof value === 'string' && value.trim().length > 0;
export const approvedPhotos = info => (Array.isArray(info.photos)?info.photos:[]).filter(p=>p && p.authorized===true && p.real===true && text(p.caption) && safePublicUrl(p.url));
export const approvedTestimonials = info => (Array.isArray(info.testimonials)?info.testimonials:[]).filter(t=>t && t.authorized===true && t.verified===true && t.active===true && text(t.name) && text(t.text) && text(t.source));
