// src/features/returnable-material/hooks/useReturnableMaterials.js
import { useState, useEffect } from "react"
import { getReturnables } from "../services/returnableService"

export function useReturnableMaterials() {
    const [returnables, setReturnables] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        getReturnables()
            .then(setReturnables)
            .catch(setError)
            .finally(() => setLoading(false))
    }, [])

    return { returnables, setReturnables, loading, error }
}
