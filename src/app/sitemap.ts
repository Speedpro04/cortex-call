import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://solaraconnect.online',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Aqui no futuro adicionaremos rotas pra artigos ou páginas secundárias de SEO
  ]
}
