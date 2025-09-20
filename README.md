# 📚 BookStore - Tienda de Ebooks

Una aplicación web moderna para la venta de ebooks construida con React, TypeScript, Tailwind CSS y Supabase.

## ✨ Características

- 🔐 **Autenticación segura** con Supabase Auth
- 📖 **Catálogo completo** de ebooks con búsqueda y filtros
- 🛒 **Carrito de compras** funcional
- 💳 **Sistema de pagos** simulado
- 👤 **Perfiles de usuario** con biblioteca personal
- ⚙️ **Panel de administración** para gestionar libros
- 📱 **Diseño responsivo** y moderno
- 🎨 **UI/UX atractiva** con Tailwind CSS

## 🚀 Configuración e Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta de Supabase

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd ebooks-store
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia tu URL del proyecto y la clave pública (anon key)
3. Ejecuta el script SQL que está en `supabase-schema.sql` en el SQL Editor de Supabase
4. Actualiza las credenciales en `src/config/supabase.ts`:

```typescript
const supabaseUrl = 'https://tu-proyecto.supabase.co'
const supabaseAnonKey = 'tu-clave-publica-aqui'
```

### 4. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

### Tablas principales:

- **ebooks**: Catálogo de libros digitales
- **profiles**: Perfiles de usuario (extiende auth.users)
- **purchases**: Historial de compras
- **cart_items**: Elementos del carrito de compras

### Características de seguridad:

- Row Level Security (RLS) habilitado
- Políticas de acceso granulares
- Autenticación con proveedores OAuth (Google, GitHub)

## 🎯 Funcionalidades Principales

### Para Usuarios:
- Registro e inicio de sesión
- Exploración del catálogo con filtros
- Adición de libros al carrito
- Compra de ebooks
- Descarga de libros adquiridos
- Gestión del perfil personal

### Para Administradores:
- Panel de control con estadísticas
- Gestión completa de ebooks (CRUD)
- Visualización de ventas e ingresos
- Control de libros destacados

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast
- **Routing**: React Router DOM
- **UI Components**: Supabase Auth UI

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── Navbar.tsx      # Barra de navegación
├── config/             # Configuración
│   └── supabase.ts     # Cliente de Supabase
├── pages/              # Páginas de la aplicación
│   ├── Home.tsx        # Página de inicio
│   ├── Catalog.tsx     # Catálogo de libros
│   ├── EbookDetail.tsx # Detalles del libro
│   ├── Login.tsx       # Autenticación
│   ├── Profile.tsx     # Perfil de usuario
│   ├── Cart.tsx        # Carrito de compras
│   └── Admin.tsx       # Panel de administración
├── App.tsx             # Componente principal
├── main.tsx           # Punto de entrada
└── index.css          # Estilos globales
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Despliega automáticamente

### Netlify

1. Conecta tu repositorio con Netlify
2. Configura el comando de build: `npm run build`
3. Directorio de publicación: `dist`
4. Configura las variables de entorno

## 🔐 Configuración de Administrador

Para convertir un usuario en administrador:

1. Ve a la tabla `profiles` en Supabase
2. Cambia el campo `is_admin` a `true` para el usuario deseado
3. El usuario tendrá acceso al panel de administración en `/admin`

## 📝 Próximas Características

- [ ] Integración con Stripe para pagos reales
- [ ] Sistema de reseñas y calificaciones
- [ ] Categorías avanzadas con subcategorías
- [ ] Sistema de descuentos y cupones
- [ ] Notificaciones push
- [ ] Modo oscuro
- [ ] Soporte multiidioma

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes alguna pregunta o necesitas ayuda, puedes:

- Abrir un issue en GitHub
- Contactar al equipo de desarrollo

---

Desarrollado con ❤️ usando React y Supabase
