"""
Validación de los archivos que se suben al sistema.

El frontend ya filtra con fileSchema.js y con el accept de cada campo, pero eso
es comodidad para el usuario, no seguridad: el accept solo decide qué muestra
el explorador de archivos, y cualquiera puede llamar la API directamente y
mandar lo que quiera. Esta es la validación que de verdad cuenta.

Se revisan tres cosas, porque cada una por separado se puede burlar:

  - La extensión del nombre. Es lo único que ve el usuario, y también lo más
    fácil de cambiar: basta renombrar el archivo.
  - El content_type. Lo declara el navegador a partir de la extensión, así que
    una petición hecha a mano puede decir "image/png" de cualquier cosa.
  - Los primeros bytes del contenido (la firma del formato). Es lo único que
    describe el archivo de verdad.

Un .txt renombrado a .png pasa las dos primeras y falla la tercera.

Los formatos se piden por grupo, no sueltos, porque cada endpoint acepta cosas
distintas: la foto de perfil y la imagen del material solo admiten imágenes,
las cotizaciones solo PDF, y las fichas técnicas ambas.
"""
import os

# Mismo tope que MAX_SIZE en frontend/src/shared/schemas/fileSchema.js
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


# Por formato: nombre para los mensajes, content_types aceptados, extensiones y
# una función que reconoce la firma en los primeros bytes del archivo.
FORMATOS = {
    'png': {
        'nombre': 'PNG',
        'tipos': {'image/png'},
        'extensiones': {'.png'},
        'firma': lambda c: c.startswith(b'\x89PNG\r\n\x1a\n'),
    },
    'jpg': {
        'nombre': 'JPG',
        # image/jpg no es oficial, pero algunos navegadores y clientes lo mandan
        'tipos': {'image/jpeg', 'image/jpg'},
        'extensiones': {'.jpg', '.jpeg'},
        'firma': lambda c: c.startswith(b'\xff\xd8\xff'),
    },
    'webp': {
        'nombre': 'WEBP',
        'tipos': {'image/webp'},
        'extensiones': {'.webp'},
        # WEBP es un contenedor RIFF: "RIFF" + 4 bytes de tamaño + "WEBP"
        'firma': lambda c: c[:4] == b'RIFF' and c[8:12] == b'WEBP',
    },
    'pdf': {
        'nombre': 'PDF',
        'tipos': {'application/pdf'},
        'extensiones': {'.pdf'},
        'firma': lambda c: c.startswith(b'%PDF-'),
    },
}

# Grupos que usan los endpoints
IMAGENES       = ('png', 'jpg', 'webp')   # fotos de perfil e imágenes de material
DOCUMENTOS     = ('pdf',)                 # cotizaciones
IMAGENES_Y_PDF = IMAGENES + DOCUMENTOS    # fichas técnicas

# 12 bytes alcanzan para todas las firmas de arriba (la más larga es la de WEBP)
BYTES_DE_FIRMA = 12


def _leer_cabecera(archivo):
    """
    Lee los primeros bytes sin consumir el archivo.

    Deja el puntero en 0 al terminar, que es justo donde lo necesitan las views:
    después de validar hacen archivo.read() para subirlo a Supabase.
    """
    archivo.seek(0)
    cabecera = archivo.read(BYTES_DE_FIRMA)
    archivo.seek(0)
    return cabecera


def error_de_archivo(archivo, formatos=IMAGENES, max_bytes=MAX_BYTES):
    """
    Revisa un archivo subido.

    Devuelve el mensaje del problema, o None si el archivo sirve. Se devuelve
    el mensaje en vez de lanzar una excepción para que cada view arme su propia
    respuesta 400 con el formato que ya venía usando.

    Args:
        archivo:   un UploadedFile de request.FILES
        formatos:  grupo de formatos permitidos (IMAGENES, DOCUMENTOS, ...)
        max_bytes: tamaño máximo
    """
    permitidos = ', '.join(FORMATOS[f]['nombre'] for f in formatos)

    if archivo.size > max_bytes:
        return f'El archivo supera el tamaño máximo de {max_bytes // (1024 * 1024)} MB.'

    extension = os.path.splitext(archivo.name)[1].lower()
    tipo = (archivo.content_type or '').lower()

    # Un formato solo cuenta si la extensión Y el content_type concuerdan entre
    # sí. Así se descarta de entrada un .txt que dice ser image/png.
    coincidencias = [
        f for f in formatos
        if extension in FORMATOS[f]['extensiones'] and tipo in FORMATOS[f]['tipos']
    ]
    if not coincidencias:
        return f'Formato no permitido. Solo se aceptan archivos {permitidos}.'

    cabecera = _leer_cabecera(archivo)
    if not any(FORMATOS[f]['firma'](cabecera) for f in coincidencias):
        return (
            'El contenido del archivo no corresponde con su extensión. '
            f'Solo se aceptan archivos {permitidos}.'
        )

    return None


def error_de_archivos(archivos, formatos=IMAGENES, max_bytes=MAX_BYTES):
    """
    Igual que error_de_archivo, para una lista.

    Se detiene en el primero que falle y antepone el nombre del archivo, para
    que el usuario sepa cuál de los que arrastró es el problema.
    """
    for archivo in archivos:
        error = error_de_archivo(archivo, formatos, max_bytes)
        if error:
            return f'{archivo.name}: {error}'
    return None
