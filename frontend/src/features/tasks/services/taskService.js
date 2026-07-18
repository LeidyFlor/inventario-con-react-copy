const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

function getHeaders() {
    const token = sessionStorage.getItem("token")
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    }
}

/**
 * Crea tarea para un usuario ya existente.
 * Usada desde ViewUserPage (inmediato) y como segundo request en UserRegisterForm (tras crear usuario).
 */
export async function createTaskForUser(userId, taskData) {
    const res = await fetch(`${API_URL}/tasks/for-user/${userId}/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            task_name:        taskData.taskName,
            task_description: taskData.taskDescription,
            task_date_start:  taskData.taskDateStart,
            task_date_end:    taskData.taskDateEnd,
        }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err))
    }
    return res.json()
}

/** Convierte Date o string ISO a formato YYYY-MM-DD que espera Django. */
const toDateStr = (d) => {
    if (!d) return null
    if (d instanceof Date) return d.toISOString().slice(0, 10)
    return String(d).slice(0, 10)
}

/**
 * Crea tarea desde gestión de tareas (con user o group y estado explícito).
 */
export async function createTask(taskData) {
    const body = {
        task_name:        taskData.taskName,
        task_description: taskData.taskDescription,
        task_date_start:  toDateStr(taskData.taskDateStart),
        task_date_end:    toDateStr(taskData.taskDateEnd),
        task_state:       taskData.taskState,
    }
    // El select devuelve el ID como value; sólo se envía el que esté seleccionado
    if (taskData.userName)  body.user  = taskData.userName
    if (taskData.userType)  body.group = taskData.userType

    const res = await fetch(`${API_URL}/tasks/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err))
    }
    return res.json()
}

/** Lista todas las tareas. */
export async function getTasks() {
    const res = await fetch(`${API_URL}/tasks/`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Error al obtener tareas")
    return res.json()
}

/** Lista tareas de un usuario. */
export async function getTasksByUser(userId) {
    const res = await fetch(`${API_URL}/tasks/?user=${userId}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Error al obtener tareas del usuario")
    return res.json()
}

/** Lista tareas de un grupo. */
export async function getTasksByGroup(groupId) {
    const res = await fetch(`${API_URL}/tasks/?group=${groupId}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Error al obtener tareas del grupo")
    return res.json()
}

/** Edita una tarea (PATCH parcial). */
export async function updateTask(taskId, taskData) {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(taskData),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err))
    }
    return res.json()
}

/** Elimina una tarea. */
export async function deleteTask(taskId) {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
        method: "DELETE",
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Error al eliminar la tarea")
}
