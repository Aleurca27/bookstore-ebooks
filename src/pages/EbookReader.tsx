import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  Settings, 
  Search, 
  Bookmark, 
  MoreVertical,
  Sun,
  Moon,
  Type,
  Minus,
  Plus,
  Menu,
  X
} from 'lucide-react'
import { Icon } from '@iconify/react'
import { supabase, type Ebook } from '../config/supabase'
import { getBookCoverImageWithSize } from '../utils/imageOverrides'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface EbookReaderProps {
  user: User | null
}

interface Chapter {
  id: number
  title: string
  content: string
}

export default function EbookReader({ user }: EbookReaderProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Ebook | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [darkMode, setDarkMode] = useState(false)
  const [fontFamily, setFontFamily] = useState('serif')

  // Contenido simulado del libro
  const chapters: Chapter[] = [
    {
      id: 1,
      title: "Capítulo 1: Fundamentos del Marketing Digital",
      content: `
        <h2>Capítulo 1: Fundamentos del Marketing Digital</h2>
        
        <p>En el mundo actual, el marketing digital no es una opción, es una necesidad. Las empresas que no adoptan estrategias digitales efectivas se quedan atrás, mientras que aquellas que las implementan correctamente pueden multiplicar sus ventas exponencialmente.</p>

        <h3>¿Qué es realmente el Marketing Digital?</h3>
        
        <p>El marketing digital es mucho más que publicar en redes sociales o crear un sitio web. Es un ecosistema completo de estrategias interconectadas que trabajan juntas para:</p>
        
        <ul>
          <li><strong>Atraer</strong> a tu audiencia ideal</li>
          <li><strong>Convertir</strong> visitantes en clientes</li>
          <li><strong>Retener</strong> y fidelizar a tus clientes</li>
          <li><strong>Escalar</strong> tu negocio de forma sostenible</li>
        </ul>

        <h3>Los 4 Pilares del Marketing Digital Exitoso</h3>
        
        <h4>1. Investigación y Estrategia</h4>
        <p>Antes de crear cualquier campaña, necesitas entender profundamente a tu audiencia. No se trata solo de demografía básica, sino de comprender sus dolores, deseos, comportamientos y el journey completo que siguen antes de comprar.</p>
        
        <blockquote>
          "El 90% de las campañas fallidas fracasan por falta de investigación previa, no por falta de presupuesto." - Estudio Digital Marketing Institute 2024
        </blockquote>

        <h4>2. Contenido que Conecta</h4>
        <p>Tu contenido debe resolver problemas reales de tu audiencia. Cada pieza de contenido debe tener un propósito claro: educar, entretener, inspirar o persuadir.</p>

        <h4>3. Distribución Estratégica</h4>
        <p>No se trata de estar en todas las plataformas, sino de estar donde está tu audiencia y con el mensaje correcto para cada canal.</p>

        <h4>4. Medición y Optimización</h4>
        <p>Lo que no se mide, no se puede mejorar. Necesitas sistemas de tracking robustos para entender qué funciona y qué no.</p>

        <h3>Caso de Estudio: TechStart Chile</h3>
        
        <p>TechStart Chile era una startup de software B2B que luchaba por generar leads de calidad. Tenían un gran producto pero no llegaban a su audiencia correcta.</p>
        
        <p><strong>El problema:</strong> Gastaban $50.000 mensuales en Google Ads sin resultados claros.</p>
        
        <p><strong>La solución aplicada:</strong></p>
        <ol>
          <li>Redefinimos su buyer persona basado en entrevistas reales</li>
          <li>Creamos contenido educativo específico para cada etapa del funnel</li>
          <li>Implementamos una estrategia de nurturing por email</li>
          <li>Optimizamos sus landing pages con principios de psicología de conversión</li>
        </ol>
        
        <p><strong>Resultados en 90 días:</strong></p>
        <ul>
          <li>280% de aumento en leads calificados</li>
          <li>Reducción del 60% en costo por lead</li>
          <li>Incremento del 45% en tasa de conversión</li>
          <li>ROI de 4.2x en sus campañas digitales</li>
        </ul>

        <h3>Tu Plan de Acción Inmediato</h3>
        
        <p>Antes de continuar con el siguiente capítulo, completa estos ejercicios:</p>
        
        <div class="action-box">
          <h4>Ejercicio 1: Audit Digital Rápido</h4>
          <p>Responde estas preguntas sobre tu negocio actual:</p>
          <ul>
            <li>¿Cuál es tu principal fuente de leads actualmente?</li>
            <li>¿Cuánto gastas mensualmente en marketing?</li>
            <li>¿Cuál es tu tasa de conversión promedio?</li>
            <li>¿Qué porcentaje de tus ventas viene de canales digitales?</li>
          </ul>
        </div>

        <div class="tip-box">
          <h4 className="flex items-center">
            <Icon icon="material-symbols:lightbulb-outline" className="w-5 h-5 mr-2 text-yellow-500" />
            Tip del Experto
          </h4>
          <p>La mayoría de empresas chilenas subestiman el tiempo necesario para ver resultados en marketing digital. Los primeros resultados significativos aparecen entre 60-90 días, pero los resultados exponenciales vienen después de 6 meses de implementación consistente.</p>
        </div>

        <p>En el próximo capítulo veremos cómo realizar una investigación de mercado moderna que te permita entender profundamente a tu audiencia y crear mensajes que realmente conviertan.</p>
      `
    },
    {
      id: 2,
      title: "Capítulo 2: Investigación de Mercado 2.0",
      content: `
        <h2>Capítulo 2: Investigación de Mercado 2.0</h2>
        
        <p>La investigación de mercado tradicional está muerta. Las encuestas genéricas y los focus groups ya no son suficientes en un mundo donde el comportamiento del consumidor cambia cada mes.</p>

        <p>En este capítulo aprenderás las técnicas modernas que usan las empresas más exitosas para entender profundamente a su audiencia.</p>

        <h3>El Framework C.I.R.C.L.E</h3>
        
        <p>Hemos desarrollado un framework que nos ha permitido aumentar la efectividad de nuestras campañas en un 300% promedio:</p>

        <h4>C - Customer Personas Avanzadas</h4>
        <p>Olvídate de las personas básicas. Necesitas crear "Customer Avatars" que incluyan:</p>
        <ul>
          <li><strong>Datos psicográficos:</strong> Valores, creencias, miedos</li>
          <li><strong>Comportamiento digital:</strong> Qué contenido consumen, cuándo, dónde</li>
          <li><strong>Pain Points específicos:</strong> No solo qué problema tienen, sino cómo lo experimentan emocionalmente</li>
          <li><strong>Jobs to be Done:</strong> Qué "trabajo" quieren que tu producto haga por ellos</li>
        </ul>

        <h4>I - Intelligence Gathering</h4>
        <p>Herramientas modernas para recopilar datos:</p>
        <ul>
          <li><strong>Social Listening:</strong> Monitorea conversaciones reales sobre tu industria</li>
          <li><strong>Customer Interviews:</strong> Entrevistas profundas con técnicas psicológicas</li>
          <li><strong>Data Mining:</strong> Análisis de patrones en tus datos existentes</li>
          <li><strong>Competitor Intelligence:</strong> Qué están haciendo tus competidores que funciona</li>
        </ul>

        <h3>Herramientas Esenciales para Investigación Moderna</h3>

        <h4>Gratuitas:</h4>
        <ul>
          <li><strong>Google Trends:</strong> Para entender qué busca tu audiencia</li>
          <li><strong>Facebook Audience Insights:</strong> Demographics y comportamientos</li>
          <li><strong>Reddit/Quora:</strong> Conversaciones auténticas sobre problemas</li>
          <li><strong>YouTube Analytics:</strong> Qué contenido consume tu audiencia</li>
        </ul>

        <h4>Pagadas (Alto ROI):</h4>
        <ul>
          <li><strong>SparkToro:</strong> Investigación de audiencia avanzada</li>
          <li><strong>BuzzSumo:</strong> Análisis de contenido viral</li>
          <li><strong>Hotjar:</strong> Mapas de calor y grabaciones de sesiones</li>
          <li><strong>Typeform:</strong> Encuestas inteligentes con lógica condicional</li>
        </ul>

        <h3>Caso Práctico: Investigación Real</h3>
        
        <p>Vamos a ver cómo aplicamos este framework con un cliente real: "FitnessPro", una app de fitness para mujeres profesionales.</p>

        <h4>Situación Inicial:</h4>
        <p>FitnessPro tenía 5,000 usuarios pero una retención terrible (20% a los 30 días). Creían que su problema era el precio.</p>

        <h4>Proceso de Investigación:</h4>
        
        <p><strong>Paso 1: Customer Interviews (50 usuarias)</strong></p>
        <p>Descubrimos que el problema no era el precio, sino que:</p>
        <ul>
          <li>Las mujeres profesionales se sentían culpables por no tener tiempo</li>
          <li>Los entrenamientos de 45-60 minutos eran irreales para su estilo de vida</li>
          <li>Necesitaban flexibilidad, no más opciones</li>
        </ul>

        <p><strong>Paso 2: Social Listening</strong></p>
        <p>Analizamos 10,000 conversaciones en redes sociales sobre fitness femenino y encontramos patrones:</p>
        <ul>
          <li>"No tengo tiempo" aparecía en 67% de los posts</li>
          <li>"Me siento culpable" en 43%</li>
          <li>"Necesito algo rápido" en 52%</li>
        </ul>

        <p><strong>Paso 3: Competitive Analysis</strong></p>
        <p>Las apps exitosas no competían en features, sino en "time-to-value". Los usuarios querían resultados rápidos y visibles.</p>

        <h4>Insights Clave Descubiertos:</h4>
        <blockquote>
          "No vendemos ejercicio, vendemos la sensación de ser una mujer exitosa que también cuida su salud, sin sacrificar su carrera."
        </blockquote>

        <h4>Cambios Implementados:</h4>
        <ol>
          <li><strong>Messaging:</strong> De "Ponte en forma" a "15 minutos que cambiarán tu día"</li>
          <li><strong>Producto:</strong> Entrenamientos de 15 minutos máximo</li>
          <li><strong>Onboarding:</strong> Enfoque en "time-saving" no en "calorie-burning"</li>
          <li><strong>Content Marketing:</strong> Historias de mujeres profesionales exitosas</li>
        </ol>

        <h4>Resultados en 4 meses:</h4>
        <ul>
          <li>Retención de 30 días subió de 20% a 68%</li>
          <li>LTV (Lifetime Value) aumentó 340%</li>
          <li>Costo de adquisición bajó 45%</li>
          <li>Reviews en App Store subieron de 3.2 a 4.7</li>
        </ul>

        <h3>Template: Entrevista de Cliente Perfecta</h3>
        
        <div class="template-box">
          <h4>Guion de Entrevista (30 minutos)</h4>
          
          <p><strong>Apertura (5 min):</strong></p>
          <p>"Gracias por tu tiempo. Queremos mejorar nuestro producto/servicio y tu experiencia es valiosa. No hay respuestas correctas o incorrectas, solo queremos entender tu perspectiva real."</p>
          
          <p><strong>Contexto Personal (10 min):</strong></p>
          <ul>
            <li>Cuéntame sobre un día típico tuyo</li>
            <li>¿Cuáles son tus principales desafíos profesionales/personales?</li>
            <li>¿Qué te frustra más en tu día a día?</li>
            <li>¿Qué te da más satisfacción?</li>
          </ul>

          <p><strong>Problema Específico (10 min):</strong></p>
          <ul>
            <li>Antes de conocer nuestro producto, ¿cómo manejabas [problema específico]?</li>
            <li>¿Qué probaste antes que no funcionó?</li>
            <li>¿Cuánto tiempo/dinero perdiste en soluciones que no funcionaron?</li>
            <li>¿Qué pensaste la primera vez que escuchaste sobre nosotros?</li>
          </ul>

          <p><strong>Experiencia con tu Producto (5 min):</strong></p>
          <ul>
            <li>¿Qué te convenció finalmente de probar nuestro producto?</li>
            <li>¿Cómo ha cambiado tu día a día desde que lo usas?</li>
            <li>Si tuvieras que recomendarnos a un amigo, ¿qué le dirías exactamente?</li>
          </ul>
        </div>

        <h3>Análisis de la Competencia: El Framework S.P.Y</h3>

        <h4>S - Strategy (Estrategia)</h4>
        <ul>
          <li>¿Qué mensaje principal usan?</li>
          <li>¿A qué audiencia se dirigen?</li>
          <li>¿Qué propuesta de valor destacan?</li>
          <li>¿Qué objeciones manejan y cómo?</li>
        </ul>

        <h4>P - Performance (Rendimiento)</h4>
        <ul>
          <li>¿Qué contenido recibe más engagement?</li>
          <li>¿Qué keywords rankean mejor?</li>
          <li>¿Cuáles son sus anuncios más longevos? (señal de que funcionan)</li>
          <li>¿Qué tipo de creatividades usan más?</li>
        </ul>

        <h4>Y - Yank (Lo que puedes tomar)</h4>
        <ul>
          <li>¿Qué puedes adaptar (no copiar) a tu negocio?</li>
          <li>¿Qué gaps encuentras en su estrategia?</li>
          <li>¿Qué están haciendo mal que tú puedes hacer mejor?</li>
        </ul>

        <div class="action-box">
          <h4>Ejercicio Práctico</h4>
          <p>Antes de continuar al próximo capítulo, completa esta investigación:</p>
          <ol>
            <li>Identifica 3 competidores directos</li>
            <li>Analiza sus últimos 20 posts en redes sociales</li>
            <li>Identifica qué tipo de contenido recibe más engagement</li>
            <li>Lista 5 insights que puedes aplicar a tu estrategia</li>
          </ol>
        </div>

        <p>En el próximo capítulo aprenderás cómo convertir toda esta investigación en contenido viral que tu audiencia no pueda ignorar.</p>
      `
    },
    {
      id: 3,
      title: "Capítulo 3: Creación de Contenido Viral",
      content: `
        <h2>Capítulo 3: Creación de Contenido Viral</h2>
        
        <p>El contenido viral no es casualidad. Es ciencia aplicada correctamente. En este capítulo aprenderás las fórmulas exactas que han generado millones de views y miles de leads para nuestros clientes.</p>

        <h3>La Psicología del Contenido Viral</h3>
        
        <p>Antes de hablar de técnicas, necesitas entender por qué las personas comparten contenido. Harvard Business Review identificó 6 motivaciones principales:</p>

        <ol>
          <li><strong>Para ayudar a otros:</strong> 49% comparte para informar/ayudar</li>
          <li><strong>Para definir su identidad:</strong> 68% comparte contenido que los representa</li>
          <li><strong>Para crear conexiones:</strong> 78% comparte para conectar con otros</li>
          <li><strong>Para ser visto como experto:</strong> 85% de los profesionales comparte contenido de su industria</li>
          <li><strong>Para sentirse importante:</strong> Ser el primero en compartir algo nuevo</li>
          <li><strong>Para entretenerse:</strong> Contenido que les saca una sonrisa</li>
        </ol>

        <h3>El Framework V.I.R.A.L</h3>

        <h4>V - Value First (Valor Primero)</h4>
        <p>Tu contenido debe resolver un problema específico o enseñar algo nuevo en menos de 30 segundos. Pregúntate: "¿Mi audiencia es más inteligente/exitosa/feliz después de consumir esto?"</p>

        <p><strong>Ejemplos de valor alto:</strong></p>
        <ul>
          <li>"Cómo aumenté mis ventas 200% con este email de 3 líneas"</li>
          <li>"El error de $50,000 que cometí para que tú no lo hagas"</li>
          <li>"5 métricas que todo CEO debería revisar cada lunes"</li>
        </ul>

        <h4>I - Immediate Hook (Gancho Inmediato)</h4>
        <p>Tienes 3 segundos para captar atención. El primer línea/imagen debe crear curiosidad o urgencia instantánea.</p>

        <p><strong>Fórmulas de ganchos comprobados:</strong></p>
        <ul>
          <li><strong>El Confesional:</strong> "Admito que estaba equivocado sobre..."</li>
          <li><strong>El Contrarian:</strong> "Todo el mundo dice X, pero la realidad es Y"</li>
          <li><strong>El Behind-the-scenes:</strong> "Lo que realmente pasa cuando..."</li>
          <li><strong>El Number Game:</strong> "3 cosas que cambiarán..."</li>
          <li><strong>El Story Hook:</strong> "Hace 2 años estaba quebrado, hoy..."</li>
        </ul>

        <h3>Caso de Estudio: Post que Generó 50,000 Leads</h3>
        
        <p>Analicemos un post de LinkedIn que generó 2.3M de impresiones y 50,000 leads para una consultora de marketing:</p>

        <div class="case-study-box">
          <h4>El Post Original:</h4>
          <blockquote>
            "Gasté $500,000 en Facebook Ads en 2023.<br><br>
            
            Aquí están los 5 errores que casi me quiebran:<br><br>
            
            1. Targeting demasiado amplio<br>
            • Creía que más audiencia = más ventas<br>
            • Reality: Audiencia específica convierte 4x mejor<br><br>
            
            2. No testear creatividades<br>
            • Usaba la misma imagen por meses<br>
            • Reality: La fatiga publicitaria mata campañas en 14 días<br><br>
            
            3. Optimizar para clicks, no para ventas<br>
            • Clicks baratos no significan ventas altas<br>
            • Reality: CPA es la única métrica que importa<br><br>
            
            4. No hacer remarketing<br>
            • Perdía 96% de visitantes para siempre<br>
            • Reality: Remarketing genera 3x más ventas que cold traffic<br><br>
            
            5. Falta de email follow-up<br>
            • Solo confiaba en la conversión inmediata<br>
            • Reality: 70% de las ventas vienen después del primer contacto<br><br>
            
            ¿Cuál de estos errores has cometido tú?<br><br>
            
            P.D: Si quieres el template exacto que uso ahora para generar ROI de 400%, comenta 'TEMPLATE' 👇"
          </blockquote>
        </div>

        <h4>¿Por qué funcionó este post?</h4>
        
        <ol>
          <li><strong>Credibility Boost:</strong> "$500,000 gastados" = autoridad instantánea</li>
          <li><strong>Vulnerability:</strong> Admite errores = conexión emocional</li>
          <li><strong>Actionable Value:</strong> 5 insights específicos y aplicables</li>
          <li><strong>Pattern Interrupt:</strong> Estructura visual fácil de escanear</li>
          <li><strong>Clear CTA:</strong> Instrucción específica para engagement</li>
          <li><strong>Lead Magnet:</strong> Promesa de valor adicional</li>
        </ol>

        <h3>Los 7 Tipos de Contenido que Siempre Funcionan</h3>

        <h4>1. Behind-the-Scenes</h4>
        <p>Muestra el proceso, no solo el resultado.</p>
        <p><strong>Ejemplo:</strong> "Así preparo mis presentaciones de ventas que cierran 85% de los prospectos"</p>

        <h4>2. Case Studies con Números</h4>
        <p>Resultados específicos y proceso para lograrlos.</p>
        <p><strong>Ejemplo:</strong> "Cómo ayudé a este cliente a pasar de $10K a $100K en 6 meses"</p>

        <h4>3. Contrarian Takes</h4>
        <p>Desafía creencias populares con evidencia.</p>
        <p><strong>Ejemplo:</strong> "Por qué 'el cliente siempre tiene la razón' está matando tu negocio"</p>

        <h4>4. Personal Stories con Lección</h4>
        <p>Vulnerabilidad + aprendizaje aplicable.</p>
        <p><strong>Ejemplo:</strong> "El día que perdí mi primer cliente por este email"</p>

        <h4>5. Listas Accionables</h4>
        <p>Información que pueden implementar hoy.</p>
        <p><strong>Ejemplo:</strong> "5 KPIs que todo CEO debe revisar cada lunes"</p>

        <h4>6. Predictions/Trends</h4>
        <p>Análisis del futuro basado en datos actuales.</p>
        <p><strong>Ejemplo:</strong> "3 cambios en marketing digital que veremos en 2024"</p>

        <h4>7. Resources/Tools</h4>
        <p>Herramientas útiles con contexto de uso.</p>
        <p><strong>Ejemplo:</strong> "10 herramientas gratuitas que uso para automatizar mi negocio"</p>

        <h3>Template de Contenido Viral</h3>

        <div class="template-box">
          <h4>Estructura Ganadora (Cualquier Plataforma)</h4>
          
          <p><strong>Hook (Línea 1):</strong> [Resultado/Confesión/Número impactante]</p>
          
          <p><strong>Context (Líneas 2-3):</strong> Por qué esto importa/situación</p>
          
          <p><strong>Value (Cuerpo):</strong></p>
          <ul>
            <li>Punto 1 con insight específico</li>
            <li>Punto 2 con insight específico</li>
            <li>Punto 3 con insight específico</li>
          </ul>
          
          <p><strong>Proof (Opcional):</strong> Resultado/testimonio/dato</p>
          
          <p><strong>CTA:</strong> Pregunta específica + instrucción clara</p>
          
          <p><strong>P.D.:</strong> Offer adicional/recurso gratuito</p>
        </div>

        <h3>Optimización por Plataforma</h3>

        <h4>LinkedIn:</h4>
        <ul>
          <li><strong>Timing:</strong> Martes-Jueves 8-10am</li>
          <li><strong>Formato:</strong> Texto con líneas cortas, máximo 1300 caracteres</li>
          <li><strong>Hashtags:</strong> 3-5 relevantes al final</li>
          <li><strong>Engagement:</strong> Responde comentarios en primera hora</li>
        </ul>

        <h4>Instagram:</h4>
        <ul>
          <li><strong>Visual First:</strong> Imagen/video debe contar la historia solo</li>
          <li><strong>Caption:</strong> Primera línea crucial, resto en comentarios</li>
          <li><strong>Stories:</strong> Behind-the-scenes y polls para engagement</li>
          <li><strong>Hashtags:</strong> Mix de populares (1M+) y nicho (10K-100K)</li>
        </ul>

        <h4>YouTube:</h4>
        <ul>
          <li><strong>Thumbnail:</strong> Facial expression + texto grande + colores contrastantes</li>
          <li><strong>Título:</strong> Beneficio claro + curiosity gap</li>
          <li><strong>Primeros 15 segundos:</strong> Preview del valor + promesa</li>
          <li><strong>Description:</strong> Keywords + timestamps + CTAs</li>
        </ul>

        <h3>Herramientas para Crear Contenido Viral</h3>

        <h4>Investigación de Contenido:</h4>
        <ul>
          <li><strong>BuzzSumo:</strong> Qué contenido funciona en tu nicho</li>
          <li><strong>AnswerThePublic:</strong> Preguntas que hace tu audiencia</li>
          <li><strong>Google Trends:</strong> Temas trending relevantes</li>
          <li><strong>Reddit:</strong> Conversaciones auténticas sobre problemas</li>
        </ul>

        <h4>Creación Visual:</h4>
        <ul>
          <li><strong>Canva Pro:</strong> Templates profesionales rápidos</li>
          <li><strong>Figma:</strong> Diseños más avanzados</li>
          <li><strong>Loom:</strong> Screen recordings fáciles</li>
          <li><strong>Unsplash:</strong> Fotos profesionales gratuitas</li>
        </ul>

        <h4>Scheduling y Analytics:</h4>
        <ul>
          <li><strong>Buffer:</strong> Programación multi-plataforma</li>
          <li><strong>Later:</strong> Visual content calendar</li>
          <li><strong>Sprout Social:</strong> Analytics profundos</li>
          <li><strong>Hootsuite:</strong> Gestión de equipos</li>
        </ul>

        <div class="action-box">
          <h4>Ejercicio: Tu Primera Pieza Viral</h4>
          <p>Usando el template anterior, crea un post sobre:</p>
          <ol>
            <li>Un error costoso que cometiste</li>
            <li>3 lecciones específicas que aprendiste</li>
            <li>Cómo otros pueden evitar el mismo error</li>
          </ol>
          <p>Publica en tu plataforma principal y mide engagement en 48 horas.</p>
        </div>

        <p>En el próximo capítulo aprenderás cómo convertir todo este tráfico y engagement en ventas reales a través de funnels de conversión optimizados.</p>
      `
    }
  ]

  useEffect(() => {
    if (id) {
      fetchBook(id)
      checkAccess(id)
    }
  }, [id, user])

  const fetchBook = async (bookId: string) => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', bookId)
        .single()

      if (error) throw error
      setBook(data)
    } catch (error) {
      console.error('Error fetching book:', error)
      toast.error('Error al cargar el libro')
    } finally {
      setLoading(false)
    }
  }

  const checkAccess = async (bookId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para leer este libro')
      navigate(`/libro/${bookId}`)
      return
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('ebook_id', bookId)
        .eq('status', 'completed')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) {
        toast.error('Necesitas comprar este libro para acceder al contenido')
        navigate(`/libro/${bookId}`)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      navigate(`/libro/${bookId}`)
    }
  }

  const nextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1)
    }
  }

  const prevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1)
    }
  }

  const adjustFontSize = (increment: boolean) => {
    if (increment && fontSize < 24) {
      setFontSize(fontSize + 2)
    } else if (!increment && fontSize > 14) {
      setFontSize(fontSize - 2)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando libro...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Libro no encontrado</h2>
          <Link to="/catalogo" className="text-blue-600 hover:text-blue-700">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Header del lector */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Link 
                to={`/libro/${id}`}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors md:hidden`}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden md:flex items-center space-x-3">
                <img
                  src={getBookCoverImageWithSize(book, 'small')}
                  alt={book.title}
                  className="w-10 h-12 object-cover rounded"
                />
                <div>
                  <h1 className="font-semibold text-sm">{book.title}</h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>por {book.author}</p>
                </div>
              </div>
            </div>

            {/* Center - Progress */}
            <div className="hidden md:flex items-center space-x-4">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Capítulo {currentChapter + 1} de {chapters.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentChapter + 1) / chapters.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <Settings className="h-5 w-5" />
              </button>

              <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                <Search className="h-5 w-5" />
              </button>

              <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Table of Contents */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
          border-r mt-16 md:mt-0
        `}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Contenido</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setCurrentChapter(index)
                    setShowSidebar(false)
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg transition-colors
                    ${currentChapter === index 
                      ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
                      : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                    }
                  `}
                >
                  <div className="font-medium text-sm">{chapter.title}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ~{15 + index * 5} min lectura
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Content */}
            <article 
              className={`
                prose prose-lg max-w-none
                ${darkMode ? 'prose-invert' : ''}
                ${fontFamily === 'serif' ? 'font-serif' : fontFamily === 'sans' ? 'font-sans' : 'font-mono'}
              `}
              style={{ fontSize: `${fontSize}px` }}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: chapters[currentChapter]?.content || '' }}
                className="reader-content"
              />
            </article>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
              <button
                onClick={prevChapter}
                disabled={currentChapter === 0}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors
                  ${currentChapter === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
                  }
                `}
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Anterior</span>
              </button>

              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentChapter + 1} / {chapters.length}
              </span>

              <button
                onClick={nextChapter}
                disabled={currentChapter === chapters.length - 1}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors
                  ${currentChapter === chapters.length - 1 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                <span>Siguiente</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSettings(false)}></div>
          <div className={`
            absolute right-0 top-0 h-full w-80 
            ${darkMode ? 'bg-gray-800' : 'bg-white'} 
            shadow-xl transform transition-transform duration-300
          `}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Configuración</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Tema */}
                <div>
                  <label className="block text-sm font-medium mb-3">Tema</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDarkMode(false)}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
                        ${!darkMode ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                      `}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Claro</span>
                    </button>
                    <button
                      onClick={() => setDarkMode(true)}
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
                        ${darkMode ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                      `}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Oscuro</span>
                    </button>
                  </div>
                </div>

                {/* Tamaño de fuente */}
                <div>
                  <label className="block text-sm font-medium mb-3">Tamaño de texto</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => adjustFontSize(false)}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
                    <button
                      onClick={() => adjustFontSize(true)}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Familia de fuente */}
                <div>
                  <label className="block text-sm font-medium mb-3">Familia de fuente</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className={`
                      w-full p-2 rounded-lg border 
                      ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}
                    `}
                  >
                    <option value="serif">Serif (Tradicional)</option>
                    <option value="sans">Sans Serif (Moderna)</option>
                    <option value="mono">Monospace (Código)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      <style jsx>{`
        .reader-content h1, .reader-content h2 {
          color: ${darkMode ? '#f3f4f6' : '#111827'};
          font-weight: 700;
          margin-bottom: 1.5rem;
          margin-top: 2rem;
        }
        
        .reader-content h3, .reader-content h4 {
          color: ${darkMode ? '#d1d5db' : '#374151'};
          font-weight: 600;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
        }
        
        .reader-content p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
        }
        
        .reader-content ul, .reader-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        
        .reader-content li {
          margin-bottom: 0.5rem;
        }
        
        .reader-content blockquote {
          border-left: 4px solid ${darkMode ? '#3b82f6' : '#3b82f6'};
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          background: ${darkMode ? '#1f2937' : '#f8fafc'};
          padding: 1rem;
          border-radius: 0.5rem;
        }
        
        .reader-content .action-box, .reader-content .template-box, .reader-content .case-study-box, .reader-content .tip-box {
          background: ${darkMode ? '#1f2937' : '#f8fafc'};
          border: 1px solid ${darkMode ? '#374151' : '#e5e7eb'};
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin: 2rem 0;
        }
        
        .reader-content .action-box h4, .reader-content .template-box h4, .reader-content .case-study-box h4, .reader-content .tip-box h4 {
          margin-top: 0;
          color: ${darkMode ? '#60a5fa' : '#2563eb'};
        }
        
        .reader-content strong {
          font-weight: 600;
          color: ${darkMode ? '#f9fafb' : '#111827'};
        }
      `}</style>
    </div>
  )
}
