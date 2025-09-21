// Función para sobrescribir imágenes localmente sin modificar la base de datos
export const getBookCoverImage = (book: { title: string; cover_image: string }) => {
  // Mapeo de títulos a imágenes locales
  const localImageOverrides: { [key: string]: string } = {
    'El Arte de la Programación': '/images/meta-ads-guide.png',
    // Puedes agregar más sobrescrituras aquí:
    // 'Otro Libro': '/images/otro-libro.png',
  }

  // Si existe una imagen local para este título, usarla
  if (localImageOverrides[book.title]) {
    return localImageOverrides[book.title]
  }

  // Si no, usar la imagen de la base de datos o placeholder
  return book.cover_image || 'https://via.placeholder.com/300x400?text=Libro'
}

// Función específica para diferentes tamaños
export const getBookCoverImageWithSize = (
  book: { title: string; cover_image: string }, 
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  const baseImage = getBookCoverImage(book)
  
  // Si es una imagen local, devolverla tal como está
  if (baseImage.startsWith('/images/')) {
    return baseImage
  }
  
  // Si es placeholder, ajustar el tamaño
  if (baseImage.includes('placeholder.com')) {
    const sizeMap = {
      small: '100x140',
      medium: '300x400', 
      large: '400x600'
    }
    return `https://via.placeholder.com/${sizeMap[size]}?text=Libro`
  }
  
  return baseImage
}
