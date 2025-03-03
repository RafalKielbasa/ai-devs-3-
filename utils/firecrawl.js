import FirecrawlApp from '@mendable/firecrawl-js'

import dotenv from 'dotenv'

dotenv.config()

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

// Scrape a website
export const scrapeWebsite = async (url) => {
  const scrapeResponse = await app.scrapeUrl(url, {
    formats: ['markdown'],
    onlyMainContent: false,
  })

  if (!scrapeResponse.success) {
    throw new Error(`Failed to scrape: ${scrapeResponse.error}`)
  }

  console.log(scrapeResponse)
  return scrapeResponse
}

// Crawl a website
// const crawlResponse = await app.crawlUrl('https://firecrawl.dev', {
//   limit: 100,
//   scrapeOptions: {
//     formats: ['markdown', 'html'],
//   },
// })

// if (!crawlResponse.success) {
//   throw new Error(`Failed to crawl: ${crawlResponse.error}`)
// }

// console.log(crawlResponse)
