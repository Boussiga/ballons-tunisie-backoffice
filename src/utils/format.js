export const formatPrix = (prix) => `${Number(prix).toFixed(2)} €`

// Images are served by the API under /uploads/...
export const imageSrc = (url) => (url ? `${import.meta.env.VITE_API_URL || ''}${url}` : null)
