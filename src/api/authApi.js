import client, { saveTokens, clearTokens, REFRESH_KEY } from './client'

export async function login(email, motDePasse) {
  const { data } = await client.post('/api/auth/login', { email, motDePasse })
  saveTokens(data)
  return data.admin
}

export async function getProfile() {
  const { data } = await client.get('/api/auth/profil')
  return data
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  try {
    await client.post('/api/auth/logout', { refreshToken })
  } catch {
    // even if the server call fails, we still log out locally
  }
  clearTokens()
}

export async function updateProfile({ nom, email, motDePasse }) {
  const { data } = await client.put('/api/auth/profil', { nom, email, motDePasse })
  return data
}