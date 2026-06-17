const API_URL = "/api";

export async function getDocumentTypes() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/document-types/`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        }
    })
    const types = await response.json()
    return types  // ya viene en formato { value, label }
}

export async function getUserTypes() {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_URL}/groups/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const groups = await response.json();
  //transforma el formato que espera el select ya que del back llega { id, name, is_active, permissions }
  return groups.map(group => ({
    value: group.id,
    label: group.name,
  }))
}
