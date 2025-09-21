import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight, BookOpen, Users, Award } from 'lucide-react'
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
        .limit(3)

      if (error) throw error
      setFeaturedBooks(data || [])
    } catch (error) {
      console.error('Error fetching featured books:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Chip 
              variant="flat" 
              color="primary" 
              size="lg"
              className="mb-6"
            >
              🚀 Nueva experiencia de lectura
            </Chip>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Tu biblioteca digital
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                al alcance de un clic
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-default-600 max-w-3xl mx-auto">
              Descubre miles de ebooks de los mejores autores. Compra, descarga y disfruta de forma instantánea.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                as={Link}
                to="/catalogo"
                color="primary"
                size="lg"
                variant="solid"
                className="font-semibold"
                endContent={<ArrowRight className="w-4 h-4" />}
              >
                Explorar Catálogo
              </Button>
              <Button 
                as={Link}
                to="/login"
                color="danger"
                size="lg"
                variant="solid"
                className="font-semibold"
              >
                Crear Cuenta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:scale-105 transition-transform duration-300">
              <CardBody>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <BookOpen className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">5,000+</h3>
                <p className="text-default-600">Ebooks disponibles</p>
              </CardBody>
            </Card>
            <Card className="text-center p-6 hover:scale-105 transition-transform duration-300">
              <CardBody>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-secondary/10 rounded-full">
                    <Users className="h-12 w-12 text-secondary" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">10,000+</h3>
                <p className="text-default-600">Lectores satisfechos</p>
              </CardBody>
            </Card>
            <Card className="text-center p-6 hover:scale-105 transition-transform duration-300">
              <CardBody>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-success/10 rounded-full">
                    <Award className="h-12 w-12 text-success" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">500+</h3>
                <p className="text-default-600">Autores destacados</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Libros Destacados
            </h2>
            <p className="text-lg text-default-600 max-w-2xl mx-auto">
              Descubre los ebooks más populares y mejor valorados por nuestra comunidad
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="w-full space-y-5 p-4">
                  <Skeleton className="rounded-lg">
                    <div className="h-64 rounded-lg bg-default-300"></div>
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
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredBooks.map((book) => (
                <Card key={book.id} className="hover:scale-105 transition-transform duration-300">
                  <CardBody className="p-0">
                    <div className="relative">
                      <Image
                        src={getBookCoverImageWithSize(book, 'medium')}
                        alt={book.title}
                        className="w-full h-64 object-cover"
                        radius="lg"
                      />
                      <Chip 
                        color="primary" 
                        size="lg"
                        className="absolute top-4 right-4"
                      >
                        €{book.price}
                      </Chip>
                    </div>
                  </CardBody>
                  <CardFooter className="flex-col items-start p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {book.title}
                    </h3>
                    <p className="text-default-600 mb-3">por {book.author}</p>
                    <div className="flex items-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-warning fill-current" />
                      ))}
                      <span className="text-sm text-default-500 ml-2">(4.8)</span>
                    </div>
                    <Divider className="my-4" />
                    <Button
                      as={Link}
                      to={`/libro/${book.id}`}
                      color="primary"
                      variant="shadow"
                      className="w-full font-semibold"
                      endContent={<ArrowRight className="h-4 w-4" />}
                    >
                      Ver más
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              as={Link}
              to="/catalogo"
              color="primary"
              size="lg"
              variant="flat"
              className="font-semibold"
              endContent={<ArrowRight className="h-5 w-5" />}
            >
              Ver todos los libros
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para comenzar a leer?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de lectores que ya disfrutan de nuestra biblioteca digital
          </p>
          <Button 
            as={Link}
            to="/catalogo"
            variant="solid"
            size="lg"
            className="bg-white text-primary font-semibold hover:bg-white/90"
            endContent={<ArrowRight className="h-4 w-4" />}
          >
            Explorar Catálogo
          </Button>
        </div>
      </section>
    </div>
  )
}
