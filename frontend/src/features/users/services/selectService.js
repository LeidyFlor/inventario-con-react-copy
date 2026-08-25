import { peticion } from "@/shared/services/peticion";

const API_URL = "/api";

export async function getDocumentTypes() {
    const token = sessionStorage.getItem("token")
    const response = await peticion(`${API_URL}/document-types/`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        }
    })
    const types = await response.json()
    return types  // ya viene en formato { value, label }
}

/**
 * Grupos disponibles para asignarle a un usuario.
 *
 * Solo devuelve los grupos activos: asignar uno desactivado dejaría al usuario
 * en un grupo apagado. El backend además rechaza la asignación, así que esto es
 * para que la opción ni siquiera aparezca.
 *
 * La pantalla de Gestión de grupos NO usa esta función: allí se listan todos,
 * activos y desactivados, porque justamente sirve para volver a encenderlos.
 */
export async function getUserTypes() {
  const token = sessionStorage.getItem("token");
  const response = await peticion(`${API_URL}/groups/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const groups = await response.json();
  //transforma el formato que espera el select ya que del back llega { id, name, is_active, permissions }
  return groups
    .filter(group => group.is_active)
    .map(group => ({
      value: group.id,
      label: group.name,
    }))
}
