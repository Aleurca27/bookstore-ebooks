import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight, BookOpen, Users, Award, Download, Sparkles, Zap } from 'lucide-react'
import { Icon } from '@iconify/react'
import { supabase, type Ebook } from '../config/supabase'
import { getBookCoverImageWithSize } from '../utils/imageOverrides'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Image,
  Skeleton,
  Chip,
  Divider
} from "@heroui/react"

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedBooks()
  }, [])

  const fetchFeaturedBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('featured', true)
          .limit(4)

      if (error) throw error
      setFeaturedBooks(data || [])
    } catch (error) {
      console.error('Error fetching featured books:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section - Estilo Apple */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Fondo con gradiente dinámico */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        
        {/* Elementos flotantes de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge superior - Optimizado móvil */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-300" />
              <span className="text-xs sm:text-sm font-medium">Nueva experiencia de lectura digital</span>
            </div>
          </div>

          {/* Título principal - Responsivo mejorado */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-tight px-2">
            <span className="text-white">Cambia a</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Ebooks.
            </span>
          </h1>

          {/* Subtítulo - Móvil optimizado */}
          <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 text-white/80 max-w-4xl mx-auto font-light px-4">
            Tu biblioteca digital te sorprenderá.
          </p>
          <p className="text-base sm:text-lg mb-8 sm:mb-12 text-white/60 max-w-3xl mx-auto px-4">
            Más de 5,000 ebooks al alcance de tus dedos. Descarga instantánea, lectura en cualquier dispositivo.
          </p>

          {/* Botones principales - Stack en móvil */}
          <div className="flex flex-col gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4">
            <Button 
              as={Link}
              to="/catalogo"
              size="lg"
              className="w-full sm:w-auto bg-white text-black font-semibold px-8 py-4 text-base sm:text-lg hover:bg-white/90 transition-all duration-300"
              radius="full"
              endContent={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              Explorar Catálogo
            </Button>
            <Button 
              as={Link}
              to="/login"
              size="lg"
              variant="bordered"
              className="w-full sm:w-auto border-white/30 text-white font-semibold px-8 py-4 text-base sm:text-lg hover:bg-white/10 transition-all duration-300"
              radius="full"
            >
              Comenzar Gratis
            </Button>
          </div>

        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce">
          <ArrowRight className="w-6 h-6 transform rotate-90" />
        </div>
      </section>

      {/* Marketing Digital Benefits - Estilo Apple limpio */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header simple */}
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Estrategias que transforman 
              <br />
              <span className="text-orange-500">negocios.</span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto font-light">
              Las técnicas exactas que usan las empresas más exitosas de Latinoamérica.
            </p>
          </div>

          {/* Grid limpio con más beneficios e imágenes */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
            
            {/* Benefit 1 - Limpio sin íconos */}
            <div className="text-center group">
              <div className="mb-8">
                <div className="text-5xl sm:text-6xl font-black text-emerald-500 mb-4">300%</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">ROI Promedio</h3>
                <p className="text-gray-600 leading-relaxed">
                  Automatización de funnels que multiplican tu inversión por 3.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Funnel automation</div>
                <div>✓ A/B testing avanzado</div>
                <div>✓ Customer journey mapping</div>
              </div>
            </div>

            {/* Benefit 2 - Limpio sin íconos */}
            <div className="text-center group">
              <div className="mb-8">
                <div className="text-5xl sm:text-6xl font-black text-blue-500 mb-4">+500%</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Lead Generation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Growth hacking que quintuplica tu base de clientes.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Viral loops design</div>
                <div>✓ Content marketing sistema</div>
                <div>✓ Referral programs</div>
              </div>
            </div>

            {/* Benefit 3 - Limpio sin íconos */}
            <div className="text-center group">
              <div className="mb-8">
                <div className="text-5xl sm:text-6xl font-black text-purple-500 mb-4">15%+</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Conversión</h3>
                <p className="text-gray-600 leading-relaxed">
                  Psicología del consumidor que convierte más del 15%.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Behavioral psychology</div>
                <div>✓ UX optimization</div>
                <div>✓ Persuasion triggers</div>
              </div>
            </div>

            {/* Benefit 4 - Limpio sin íconos */}
            <div className="text-center group">
              <div className="mb-8">
                <div className="text-5xl sm:text-6xl font-black text-orange-500 mb-4">72h</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Implementación</h3>
                <p className="text-gray-600 leading-relaxed">
                  Estrategias listas para aplicar en menos de 3 días.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Step-by-step guides</div>
                <div>✓ Templates incluidos</div>
                <div>✓ Casos de estudio reales</div>
              </div>
            </div>

          </div>

          {/* Sección de empresas - Limpia */}
          <div className="border-t border-gray-200 pt-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Estrategias de empresas líderes
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Aprende las mismas técnicas que usan Mercado Libre, Falabella y las startups más exitosas.
              </p>
            </div>
            
            {/* Lista de técnicas - Sin cajas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center">
                <div className="text-yellow-500 font-black text-lg mb-2">Meta Ads Secrets</div>
                <p className="text-gray-600">Optimización con IA y machine learning</p>
              </div>
              <div className="text-center">
                <div className="text-green-500 font-black text-lg mb-2">Email Marketing 2.0</div>
                <p className="text-gray-600">Automatización behavioral avanzada</p>
              </div>
            <div className="text-center">
                <div className="text-blue-500 font-black text-lg mb-2">Growth Hacking</div>
                <p className="text-gray-600">Escalamiento exponencial comprobado</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Formats Section - Mobile-first rediseñada */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
        {/* Fondo con gradiente y elementos flotantes reducidos para móvil */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-5 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header móvil optimizado */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-indigo-700 text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-lg">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-indigo-500" />
              <span>Experiencia de lectura premium</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 sm:mb-8 leading-tight px-2">
              Lee en cualquier
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                dispositivo
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto font-light px-4">
              Tecnología de vanguardia que se adapta a tu estilo de vida
            </p>
          </div>

          {/* Layout móvil: Stack vertical */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Features premium - Mobile optimized */}
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
              <div className="mb-8 sm:mb-12 text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                  Todo incluido
                </h3>
                <p className="text-base sm:text-lg text-gray-600 px-4 lg:px-0">
                  Sin restricciones, sin límites. La experiencia completa desde el primer día.
                </p>
              </div>
              
              <div className="grid gap-4 sm:gap-6">
                {[
                  { 
                    icon: BookOpen, 
                    title: "PDF & EPUB Premium", 
                    desc: "Diseño optimizado para cada pantalla con tipografía perfecta",
                    color: "from-blue-500 to-indigo-500"
                  },
                  { 
                    icon: Zap, 
                    title: "Sincronización Inteligente", 
                    desc: "Tu progreso se guarda automáticamente en todos tus dispositivos",
                    color: "from-purple-500 to-pink-500"
                  },
                  { 
                    icon: Download, 
                    title: "Acceso Instantáneo", 
                    desc: "Descarga ilimitada en segundos, sin esperas ni restricciones",
                    color: "from-emerald-500 to-teal-500"
                  }
                ].map((item, index) => (
                  <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90">
                    <CardBody className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                          <div className={`relative p-2 sm:p-3 bg-gradient-to-r ${item.color} rounded-xl`}>
                            <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            {/* Compatibilidad - Versión simplificada */}
            <div className="relative order-1 lg:order-2">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/50 shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Acceso Universal</h3>
                  <p className="text-sm sm:text-base text-gray-600">Lee en cualquier dispositivo</p>
                </div>
                
                {/* Lista simple de compatibilidad */}
                <div className="space-y-3">
                  {[
                    { text: "iOS (iPhone, iPad, Mac)", icon: "logos:apple" },
                    { text: "Android (Phones, Tablets)", icon: "logos:android-icon" }, 
                    { text: "Web (Cualquier navegador)", icon: "material-symbols:web" },
                    { text: "E-readers (Kindle, Kobo)", icon: "material-symbols:book" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Icon icon={item.icon} className="w-5 h-5 mr-3" />
                      <span className="text-sm text-gray-700">{item.text}</span>
                      <div className="ml-auto">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex items-center">
                          <Icon icon="material-symbols:check-circle" className="w-3 h-3 mr-1" />
                          Compatible
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Formatos: PDF, EPUB, MOBI</p>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white text-sm font-semibold">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      Sincronización automática
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Book Section - El Arte de la Programación */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Icon icon="material-symbols:trending-up" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-500" />
              #1 Más vendido
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              El ebook que está
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> transformando negocios</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Descubre el libro más vendido entre emprendedores chilenos que están escalando sus negocios.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Card className="w-full max-w-md space-y-5 p-3 sm:p-4">
                <Skeleton className="rounded-lg">
                  <div className="h-96 rounded-lg bg-default-300"></div>
                </Skeleton>
                <div className="space-y-3">
                  <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
                  </Skeleton>
                  <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
                  </Skeleton>
                  <Skeleton className="w-2/5 rounded-lg">
                    <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
                  </Skeleton>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
                <Card className="bg-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 overflow-hidden group">
                  <CardBody className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src="/images/meta-ads-guide.png"
                        alt="El Arte de la Programación"
                        className="w-full h-80 sm:h-96 lg:h-[500px] object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          console.log('Error cargando imagen principal, intentando fallback...')
                          e.currentTarget.src = '/images/2.png'
                          e.currentTarget.onerror = () => {
                            console.log('Error con fallback, usando placeholder')
                            e.currentTarget.src = 'https://via.placeholder.com/400x600/f3f4f6/9ca3af?text=El+Arte+de+la+Programación'
                          }
                        }}
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Price badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-gray-900 font-bold text-sm">
                          $29.900 CLP
                        </div>
                      </div>

                      {/* Best Seller badge */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-full text-xs font-bold flex items-center">
                          <Icon icon="material-symbols:star" className="w-4 h-4 mr-1" />
                          #1 BESTSELLER
                        </div>
                      </div>

                      {/* Discount badge */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          40% OFF
                        </div>
                      </div>
                  </div>
                  </CardBody>
                  <CardFooter className="flex-col items-start p-6 lg:p-8">
                    <div className="w-full">
                          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            Ebook de la Publicidad
                          </h3>
                      <p className="text-base lg:text-lg text-gray-600 mb-4 font-medium">por Carlos López</p>
                      
                      {/* Rating */}
                      <div className="flex items-center mb-6">
                        <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-3 font-medium">(4.9) • 3.2k reseñas</span>
                      </div>

                      {/* Key features */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <Icon icon="material-symbols:schedule" className="w-4 h-4 mr-2 text-blue-500" />
                          <span>2h de lectura</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Icon icon="material-symbols:download" className="w-4 h-4 mr-2 text-green-500" />
                          <span>PDF + EPUB</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Icon icon="material-symbols:update" className="w-4 h-4 mr-2 text-purple-500" />
                          <span>Actualizado 2024</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Icon icon="material-symbols:support" className="w-4 h-4 mr-2 text-orange-500" />
                          <span>Soporte incluido</span>
                        </div>
                  </div>
                      
                      {/* CTA Buttons */}
                      <div className="space-y-3">
                        <Button
                          as={Link}
                          to="/libro/1"
                          className="w-full bg-blue-600 text-white font-bold py-3 text-lg hover:bg-blue-700 transition-all duration-300"
                          radius="full"
                          size="lg"
                          endContent={<ArrowRight className="h-5 w-5" />}
                        >
                          Comprar Ahora
                        </Button>
                        <Button
                          as={Link}
                          to="/libro/1"
                          className="w-full bg-blue-600 text-white font-semibold py-3 text-base hover:bg-blue-700 transition-all duration-300"
                          radius="full"
                          size="lg"
                          endContent={<BookOpen className="h-4 w-4" />}
                        >
                          Leer
                        </Button>
                  </div>
                </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

              <div className="text-center mt-12 sm:mt-16 px-4">
                <Button
                  as={Link}
                  to="/catalogo"
                  size="lg"
                  variant="bordered"
                  className="w-full sm:w-auto border-gray-300 text-gray-700 font-semibold px-6 sm:px-8 py-3 text-sm sm:text-base hover:bg-gray-50 transition-all duration-300"
                  radius="full"
                  endContent={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                >
                  Ver más
                </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile optimized */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
        
        {/* Animated background elements - Reduced for mobile */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8 leading-tight px-2">
              Tu próxima
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> aventura</span>
              <br />
              te está esperando
          </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              Más de 2,500 lectores chilenos ya han transformado su forma de leer. ¿Te unes a ellos?
            </p>
            
            {/* Buttons stack on mobile */}
            <div className="flex flex-col gap-4 sm:gap-6 justify-center items-center px-4">
              <Button 
                as={Link}
                to="/catalogo"
                size="lg"
                className="w-full sm:w-auto bg-white text-black font-bold px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg hover:bg-white/90 transition-all duration-300 shadow-2xl"
                radius="full"
                endContent={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
              >
                Comenzar mi viaje
              </Button>
              <Button 
                as={Link}
                to="/login"
                size="lg"
                variant="bordered"
                className="w-full sm:w-auto border-white/30 text-white font-semibold px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg hover:bg-white/10 transition-all duration-300"
                radius="full"
              >
                Crear cuenta gratis
              </Button>
            </div>

            {/* Social proof - Mobile responsive */}
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-white/60 px-4">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white"></div>
                  ))}
                </div>
                <span className="ml-2 sm:ml-3 text-xs sm:text-sm">+2,500 lectores</span>
              </div>
              <div className="flex items-center">
                <div className="flex">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm">4.9/5 valoración</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
// FORCE UPDATE Sun Sep 21 02:00:35 -03 2025
