/**
 * Generate a random room code
 * Format: 4 uppercase alphanumeric characters (e.g., "8FK2")
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code) {
  return /^[A-Z0-9]{4}$/.test(code);
}

