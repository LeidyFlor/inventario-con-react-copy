// src/features/loans/services/loanService.js

const API_URL = "/api"

//  Helpers 

function getToken() {
    return sessionStorage.getItem("token")
}

// Mapea un ítem de préstamo de snake_case → camelCase
// para que LoanMaterialsTable lo reciba con los mismos nombres que usaba el mock
function mapItem(item) {
    return {
        id:               item.id,
        name:             item.material_name,
        placaSena:        item.placa_sena   ?? null,
        serial:           item.serial       ?? null,
        cantidad:         item.quantity_loaned,
        cantidadDevuelta: item.quantity_returned,
        itemState:        item.item_state   ?? "bueno",
        qtyBueno:         item.quantity_bueno   ?? null,
        qtyDanado:        item.quantity_danado  ?? null,
        qtyPerdido:       item.quantity_perdido ?? null,
        tipo:             item.material_type === "consumable" ? "Consumo" : "Devolutivo",
        isReturned:       item.is_returned,
    }
}

// Mapea un préstamo de snake_case → camelCase
function mapLoan(loan) {
    return {
        id:                   loan.id,
        idLoan:               loan.loan_code,
        loanUserRequester:    loan.loan_user_requester,
        requesterId:          loan.loan_user_requester_id ?? null,
        // Documento del solicitante, o su correo cuando no está registrado
        requesterDocument:    loan.requester_document ?? "",
        requesterEmail:       loan.requester_email ?? "",
        requesterIsRegistered: loan.requester_is_registered ?? true,
        loanUserLender:       loan.loan_user_lender,
        loanStudentsGroup:    loan.loan_students_group,
        loanJustification:    loan.loan_justification,
        loanType:             loan.loan_type,
        loanDateOut:          loan.loan_date_out,
        loanDateIn:           loan.loan_date_in,
        loanStatus:           loan.loan_status,
        identityConfirmed:    loan.identity_confirmed,
        // devolución
        returnedById:         loan.returned_by        ?? null,
        returnedByName:       loan.returned_by_name   ?? null,
        returnedAt:           loan.returned_at         ?? null,
        returnObservations:   loan.return_observations ?? "",
        // aceptación
        acceptedById:         loan.accepted_by        ?? null,
        acceptedByName:       loan.accepted_by_name   ?? null,
        acceptedAt:           loan.accepted_at         ?? null,
        acceptObservations:   loan.accept_observations ?? "",
        createdAt:            loan.created_at,
        updatedAt:            loan.updated_at,
        loanMaterials:        (loan.loan_materials ?? []).map(mapItem),
    }
}

//  GET /api/loans/ ─

/**
 * Lista de préstamos.
 *
 * Por defecto NO trae los materiales de cada préstamo: la tabla del listado no
 * los muestra y pedirlos obliga al backend a consultarlos para todos. Solo el
 * reporte los necesita, y por eso pasa includeMaterials.
 */
export async function getLoans({ includeMaterials = false } = {}) {
    const query = includeMaterials ? "?include_materials=1" : ""
    const response = await fetch(`${API_URL}/loans/${query}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) throw new Error("Error al obtener préstamos")
    const data = await response.json()
    return data.map(mapLoan)
}

//  GET /api/loans/{id}/ 

export async function getLoan(id) {
    const response = await fetch(`${API_URL}/loans/${id}/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) throw new Error("Error al obtener el préstamo")
    const data = await response.json()
    return mapLoan(data)
}

//  POST /api/loans/ 
// items: [{ material_id, material_type: "consumable"|"returnable", quantity_loaned }]

// identityToken: UUID del token confirmado (opcional)
export async function createLoan(formData, items, identityToken = null) {
    const response = await fetch(`${API_URL}/loans/`, {
        method: "POST",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            // Solicitante: registrado O correo suelto, nunca ambos. El
            // backend lo exige igual, con un CheckConstraint en la tabla.
            ...(formData.requesterIsRegistered
                ? { loan_user_requester: formData.loanUserRequester }
                : { requester_email: formData.requesterEmail }),
            loan_user_lender:    formData.loanUserLender,
            // Ficha de aprendices — opcional
            loan_students_group: formData.loanStudentsGroup || "",
            loan_justification:  formData.loanJustification,
            loan_type:           formData.loanType,
            loan_date_out:       formData.loanDateOut,
            loan_date_in:        formData.loanDateIn,
            items,
            ...(identityToken ? { identity_token: identityToken } : {}),
        }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    const data = await response.json()
    return mapLoan(data)
}

//  PATCH /api/loans/{id}/ ─
// Solo envía los campos que se pueden editar

export async function updateLoan(id, formData) {
    const response = await fetch(`${API_URL}/loans/${id}/`, {
        method: "PATCH",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            loan_date_in:      formData.loanDateIn,
            loan_justification: formData.loanJustification,
            loan_status:       formData.loanStatus,
        }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    const data = await response.json()
    return mapLoan(data)
}

//  POST /api/loans/{id}/return/
// items: [{ loan_item_id, quantity_returned, item_state }]
// returnObservations: observación opcional

// returned_by ya no se envía: el backend lo toma del usuario en sesión
export async function returnLoan(id, { items, returnObservations = "" }) {
    const response = await fetch(`${API_URL}/loans/${id}/return/`, {
        method: "POST",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            items,
            return_observations: returnObservations,
        }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return mapLoan(await response.json())
}

//  POST /api/loans/{id}/accept-return/
// acceptObservations: observación opcional del cuentadante
// (accepted_by se toma automáticamente del usuario logueado en el backend)

export async function acceptReturn(id, { acceptObservations = "" } = {}) {
    const response = await fetch(`${API_URL}/loans/${id}/accept-return/`, {
        method: "POST",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ accept_observations: acceptObservations }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return mapLoan(await response.json())
}

// DELETE /api/loans/{id}/items/{itemId}/
// Elimina un ítem del préstamo y restaura su inventario

export async function removeLoanItem(loanId, itemId) {
    const response = await fetch(`${API_URL}/loans/${loanId}/items/${itemId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return mapLoan(await response.json())
}

// POST /api/loans/verify-token/
// Comprueba si el token fue confirmado — llámalo cuando el usuario presiona "Ya confirmé"
// ANTES de crear el préstamo (no necesita loan ID)

export async function verifyToken(tokenUUID) {
    const response = await fetch(`${API_URL}/loans/verify-token/`, {
        method: "POST",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenUUID }),
    })
    if (!response.ok) throw new Error("Error al verificar token")
    // { is_confirmed, lender_confirmed, requester_confirmed, lender_id, requester_id }
    return response.json()
}

//  POST /api/loans/identity-token/ ─
// Genera el token y envía un correo a cada parte (prestador y solicitante).
// Ambos deben abrir su enlace para que el préstamo pueda crearse.

export async function createIdentityToken(lenderId, requesterId, requesterEmail = "") {
    const response = await fetch(`${API_URL}/loans/identity-token/`, {
        method: "POST",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        // Sin usuario registrado se manda el correo, y el enlace de
        // confirmación llega ahí en vez de a una cuenta del sistema
        body: JSON.stringify(
            requesterId
                ? { lender_id: lenderId, requester_id: requesterId }
                : { lender_id: lenderId, requester_email: requesterEmail }
        ),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return response.json() // { token, message, errores_envio }
}

//  POST /api/loans/{id}/check-identity/ ──
// Llámalo cuando el prestador presiona "Ya confirmé"

export async function checkIdentity(loanId, token) {
    const response = await fetch(`${API_URL}/loans/${loanId}/check-identity/`, {
        method: "POST",
        headers: {
            Authorization:  `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return response.json() // { identity_confirmed: true }
}

export async function searchLoanByCode(code) {
    const response = await fetch(`${API_URL}/loans/search/?code=${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Préstamo no encontrado")
    }
    return response.json() // { id }
}
