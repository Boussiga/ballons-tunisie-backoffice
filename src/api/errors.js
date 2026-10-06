// Pull the most useful message out of an API error
export function getErrorMessage(err, fallback = 'Une erreur est survenue.') {
  const data = err.response?.data
  return data?.erreurs?.[0]?.message || data?.message || fallback
}
