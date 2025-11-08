// Helper function to get correct image path for production/development
export function getImagePath(path: string): string {
  if (!path) return path
  
  // If path already starts with base path, return as is
  if (path.startsWith('/HomeCookHub/')) {
    return path
  }
  
  if (import.meta.env.PROD) {
    // In production, prepend base path if path starts with /
    if (path.startsWith('/')) {
      return `/HomeCookHub${path}`
    }
    // If path is relative, return as is (shouldn't happen for images)
    return path
  }
  // In development, use path as is
  return path
}

