//debe ser un FormData, yaq ue el backend recibe imagen, por eso no pude ser json. Este es el traductor para el back
const API_URL = "/api"

export async function getUsers() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/users/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Error al obtener usuarios")
    return response.json()
}

export async function getUser(id) {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/users/${id}/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Error al obtener el usuario")
    return response.json()
}

export async function toggleUserStatus(id, isActive) {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/users/${id}/`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
    })
    if (!response.ok) throw new Error("Error al actualizar estado del usuario")
    return response.json()
}

export async function createUser(formData) {
    const token = sessionStorage.getItem("token")

    const data = new FormData()
    data.append("first_name", formData.First_name)
    data.append("last_name", formData.Last_name)
    data.append("email", formData.userEmail)
    data.append("user_email2", formData.userEmail2)
    data.append("user_document_type", formData.userDocumentType)
    data.append("user_document", formData.userDocument)
    data.append("user_addres", formData.userAddres)
    data.append("user_tel", formData.userTel)
    data.append("user_tel2", formData.userTel2)
    data.append(
      "user_date_start",
      formData.userDateStart instanceof Date
        ? formData.userDateStart.toISOString().split("T")[0]
        : formData.userDateStart,
    );
    data.append(
      "user_date_end",
      formData.userDateEnd instanceof Date
        ? formData.userDateEnd.toISOString().split("T")[0]
        : formData.userDateEnd,
    );
    data.append("is_accountant", formData.is_accountant ? 1 : 0)
    data.append("is_staff",     formData.is_staff     ? 1 : 0)
    if (Array.isArray(formData.userType)){
        // se debe iterar sobre array y se hace append por cada valor
        formData.userType.forEach((groupId) =>{
            data.append("groups", Number(groupId)); //back espera int no str
        });
    } else if (formData.userType){
        //En caso de que llegue un valor que no sea un array
        data.append("groups", Number(formData.userType))  // ID del grupo
    }

    // Imagen solo si fue seleccionada
    if (formData.userImage && formData.userImage.length > 0) {
        data.append("user_image", formData.userImage[0])
    }

    const response = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            // NO agregar Content-Type — el navegador lo pone solo con el boundary correcto
        },
        body: data,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }

    return response.json()
}
//Para actualizar usuario
export async function updateUser(id, formData) {
    const token = sessionStorage.getItem("token")

    const data = new FormData()
    data.append("first_name",formData.First_name)
    data.append("last_name",formData.Last_name)
    data.append("email",formData.userEmail)
    data.append("user_email2",formData.userEmail2)
    data.append("user_document_type",formData.userDocumentType)
    data.append("user_document",formData.userDocument)
    data.append("user_addres",formData.userAddres)
    data.append("user_tel",formData.userTel)
    data.append("user_tel2", formData.userTel2);
    data.append(
      "user_date_start",
      formData.userDateStart instanceof Date
        ? formData.userDateStart.toISOString().split("T")[0]
        : formData.userDateStart,
    );
    data.append(
      "user_date_end",
      formData.userDateEnd instanceof Date
        ? formData.userDateEnd.toISOString().split("T")[0]
        : formData.userDateEnd,
    );
    data.append("is_accountant",formData.is_accountant ? 1 : 0)
     if (Array.isArray(formData.userType)){
        // se debe iterar sobre array y se hace append por cada valor
        formData.userType.forEach((groupId) =>{
            data.append("groups", Number(groupId)); //back espera int no str
        });
    } else if (formData.userType){
        //En caso de que llegue un valor que no sea un array
        data.append("groups", Number(formData.userType))  // ID del grupo
    }

    if (formData.userImage && formData.userImage.length > 0) {
        data.append("user_image", formData.userImage[0])
    }

    const response = await fetch(`/api/users/${id}/`, {
        method: "PATCH", //actualiza solo cambios que cambiaron
        headers: { "Authorization": `Bearer ${token}` },
        body: data,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return response.json()
}