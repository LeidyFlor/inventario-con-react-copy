import { useState, useEffect } from "react"
import { getMaterials } from "../services/materialService"

export function useMaterials() {
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        getMaterials()
            .then(setMaterials)
            .catch(setError)
            .finally(() => setLoading(false))
    }, [])

    return { materials, setMaterials, loading, error }
}