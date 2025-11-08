// Helper function to get correct image path for production/development
export function getImagePath(path: string): string {
  if (import.meta.env.PROD) {
    // In production, prepend base path
    return `/HomeCookHub${path}`
  }
  // In development, use path as is
  return path
}

