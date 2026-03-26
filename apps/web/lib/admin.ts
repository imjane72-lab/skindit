export const ADMIN_IDS = ["cmn2u3c07000b35uyg7ha2fud"]

export function isAdmin(userId: string): boolean {
  return ADMIN_IDS.includes(userId)
}
