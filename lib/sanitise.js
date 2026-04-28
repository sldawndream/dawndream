// Strip all HTML tags, script injections and dangerous characters from user input
export function sanitise(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')           // strip all HTML tags
    .replace(/javascript:/gi, '')       // strip javascript: protocol
    .replace(/on\w+\s*=/gi, '')        // strip onerror=, onclick= etc
    .replace(/\$regex/gi, '')          // strip $regex injection
    .replace(/[<>'"`;]/g, '')          // strip dangerous chars
    .trim()
    .slice(0, 500);                    // hard cap length
}

export function sanitiseEmail(str) {
  if (!str || typeof str !== 'string') return '';
  // Only allow valid email characters
  return str.replace(/[^a-zA-Z0-9@._+\-]/g, '').trim().slice(0, 254);
}

export function sanitiseUUID(str) {
  if (!str || typeof str !== 'string') return '';
  // Only allow UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const match = str.trim().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : '';
}
