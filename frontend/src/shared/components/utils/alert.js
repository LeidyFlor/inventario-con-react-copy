import Swal from "sweetalert2";

// Tiempos estándar de auto-cierre para alertas de éxito (ms), por defecto se aplica la de medium, pero se puede pasar como tercer parametro como TIMER.short o TIMER.long (ojo se debe importar de igual forma como se importa la alerta desde shared) import { Alert, TIMER } from "@/shared";
export const TIMER = {
    short:  3000,  // 3s
    medium: 4000,  // 4s
    long:   6000,  // 6s
}

const baseConfig = {
    // Estilos personalidos que viene de global.css
    customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-content',
        confirmButton: 'swal-btn-confirm',
        cancelButton: 'swal-btn-cancel',
        actions:       'swal-actions', 
    },
    buttonsStyling: false,
}
// objeto Alert con multiples metodos, al invocarlo solo se necesitara el tipo de metodo, titulo de descipcion. ...baseConfig sprend operator que desempaqueta los estilos en cada uno de los metodos. reverseButtons: true para que el boton de confirmar se muestre a la derecha
export const Alert = {
    success: (title, text = '', timer = TIMER.short) => Swal.fire({
        ...baseConfig,
        icon: 'success',
        title,
        text,
        timer,
        timerProgressBar: true,
        confirmButtonText: 'Aceptar',
        reverseButtons: true,
    }),
    error: (title, text = '') => Swal.fire({
        ...baseConfig,
        icon: 'error',
        title,
        text,
        confirmButtonText: 'Entendido',
        reverseButtons: true,
    }),
    warning: async (title, text = '') =>{
        const result = await Swal.fire({
            ...baseConfig,
            icon: 'warning',
            title,
            text,
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        })
        return result
    },
    confirm: async (title, text = '') =>{
        const result = await Swal.fire({
            ...baseConfig,
            icon: 'question',
            title,
            text,
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        })
        return result
    },
    loading: (title = 'Cargando...', text = '') => Swal.fire({
        ...baseConfig,
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
    }),

    close: () => Swal.close(),
}