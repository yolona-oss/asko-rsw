import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// --- Configuration ---
const BASE_URL = 'https://asko-russia.ru';
const REQUEST_DELAY_MS = 1500;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// DeviceType enum matching your MikroORM schema
enum DeviceType {
  WASHING_MACHINE = 'washing_machine',
  DISHWASHER = 'dishwasher',
  OVEN = 'oven',
  COMPACT_OVEN = 'compact_oven',
  HOB = 'hob',
  HOOD = 'hood',
  REFRIGERATOR = 'refrigerator',
  COFFEE_MACHINE = 'coffee_machine',
  DRYER = 'dryer',
  VACUUM_SEALER = 'vacuum_sealer',
  WARMER_DRAWER = 'warmer_drawer',
  MICROWAVE = 'microwave',
  COMBO_SET = 'combo_set',
  UNKNOWN = 'unknown'
}

interface CatalogInfo {
  url: string;
  type: DeviceType;
}

const CATALOG_URLS: CatalogInfo[] = [
  { url: 'https://asko-russia.ru/catalog/complects-asko/domashnyaya-prachechnaya/', type: DeviceType.COMBO_SET },
  { url: 'https://asko-russia.ru/catalog/posudomoechnye_mashiny/', type: DeviceType.DISHWASHER },
  { url: 'https://asko-russia.ru/catalog/dukhovye-shkafy/', type: DeviceType.OVEN },
  { url: 'https://asko-russia.ru/catalog/kompaktnye-dukhovye-shkafy/', type: DeviceType.COMPACT_OVEN },
  { url: 'https://asko-russia.ru/catalog/varochnye-paneli/', type: DeviceType.HOB },
  { url: 'https://asko-russia.ru/catalog/vytyazhki/', type: DeviceType.HOOD },
  { url: 'https://asko-russia.ru/catalog/kholodilniki/', type: DeviceType.REFRIGERATOR },
  { url: 'https://asko-russia.ru/catalog/complects-asko/komplekty-kbt/', type: DeviceType.COMBO_SET },
  { url: 'https://asko-russia.ru/catalog/vakuumatory/', type: DeviceType.VACUUM_SEALER },
  { url: 'https://asko-russia.ru/catalog/podogrevateli_posudy/', type: DeviceType.WARMER_DRAWER },
  { url: 'https://asko-russia.ru/catalog/mikrovolnovye_pechi/', type: DeviceType.MICROWAVE },
  { url: 'https://asko-russia.ru/catalog/kofemashiny/', type: DeviceType.COFFEE_MACHINE },
  { url: 'https://asko-russia.ru/catalog/stiralnye_mashiny/', type: DeviceType.WASHING_MACHINE }
];

// --- Interfaces matching MikroORM entity ---
interface Specifications {
  url: string;
  category: DeviceType;
  images: string[];
  technical: Record<string, string>;
  features: string[];
  technologies: string[];
  price: string | null;
  inStock: boolean;
}

interface Product {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  brand: string;
  description: string | null;
  specifications: Specifications;
}

// --- Utility Functions ---
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const fullUrl = (relativeUrl: string): string => {
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${BASE_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};

const cleanText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

const extractModelFromUrl = (url: string): string => {
  const matches = url.match(/\/([^\/]+)\.html$/);
  if (matches && matches[1]) {
    return matches[1].replace(/-/g, ' ').toUpperCase();
  }
  return '';
};

// --- Core Scraping Functions ---
async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    console.log(`🌐 Fetching: ${url}`);
    await delay(REQUEST_DELAY_MS);

    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    if (response.status !== 200) {
      console.warn(`⚠️ Received status ${response.status} for ${url}`);
      return null;
    }
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function getProductUrlsFromCatalogPage(catalogUrl: string): Promise<string[]> {
  const $ = await fetchPage(catalogUrl);
  if (!$) return [];

  const productUrls: string[] = [];
  $('a[href*=".html"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && href.includes('/catalog/') && !href.includes('#') && href.endsWith('.html')) {
      productUrls.push(fullUrl(href));
    }
  });

  return [...new Set(productUrls)];
}

async function getAllProductUrlsFromCatalog(catalogInfo: CatalogInfo): Promise<string[]> {
  console.log(`\n📁 Processing catalog: ${catalogInfo.url}`);
  let allUrls: string[] = [];
  let pageNum = 1;
  let maxPageNum = 1;

  const $page1 = await fetchPage(catalogInfo.url);
  if (!$page1) return [];

  const page1Urls = await getProductUrlsFromCatalogPage(catalogInfo.url);
  allUrls = [...allUrls, ...page1Urls];

  // Find pagination
  const paginationLinks: string[] = [];
  $page1('a').each((_, el) => {
    const href = $page1(el).attr('href');
    if (href && href.includes('PAGEN_')) {
      paginationLinks.push(href);
    }
  });

  if (paginationLinks.length > 0) {
    const pageNumbers = paginationLinks
      .map(link => {
        const match = link.match(/PAGEN_\d+=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num): num is number => num !== null);

    if (pageNumbers.length > 0) {
      maxPageNum = Math.max(...pageNumbers);
      console.log(`   Pagination detected. Max page: ${maxPageNum}`);
    }
  }

  // Fetch subsequent pages
  for (pageNum = 2; pageNum <= maxPageNum; pageNum++) {
    const separator = catalogInfo.url.includes('?') ? '&' : '?';
    const paginatedUrl = `${catalogInfo.url}${separator}PAGEN_1=${pageNum}`;
    console.log(`   Fetching page ${pageNum}...`);
    const pageUrls = await getProductUrlsFromCatalogPage(paginatedUrl);
    allUrls = [...allUrls, ...pageUrls];
  }

  console.log(`   Total unique URLs found: ${[...new Set(allUrls)].length}`);
  return [...new Set(allUrls)];
}

async function scrapeProduct(productUrl: string, deviceType: DeviceType): Promise<Product | null> {
  console.log(`🔍 Scraping product: ${productUrl}`);
  const $ = await fetchPage(productUrl);
  if (!$) return null;

  // Generate UUID for the product
  const id = uuidv4();

  // Extract model name (prioritize from URL if needed)
  let model = extractModelFromUrl(productUrl);

  // Try to get a better model name from h1
  const h1Text = $('h1').first().text();
  const modelMatch = h1Text.match(/Asko\s+(\S+)/i);
  if (modelMatch && modelMatch[1]) {
    model = modelMatch[1];
  }

  // Extract product name (full name from h1)
  const name = h1Text || model;

  // Brand is always Asko
  const brand = 'Asko';

  // Extract description
  let description = '';
  const descDiv = $('.description').text();
  if (descDiv) {
    description = cleanText(descDiv);
  } else {
    const metaDesc = $('meta[name="description"]').attr('content');
    description = metaDesc ? cleanText(metaDesc) : '';
  }

  if (!description) {
    const longDesc = $('.product-full-description, .product-tabs__content').first().text();
    if (longDesc) {
      description = cleanText(longDesc.substring(0, 2000));
    }
  }

  // Build specifications object
  const specifications: Specifications = {
    url: productUrl,
    category: deviceType,
    images: [],
    technical: {},
    features: [],
    technologies: [],
    price: null,
    inStock: false
  };

  // Extract images
  $('img').each((_, img) => {
    let src = $(img).attr('src');
    if (src) {
      const isProductImage = $(img).closest('.product-slider, .gallery, .product-image').length > 0;
      if (isProductImage && (src.includes('/upload/') || src.includes('product'))) {
        if (!src.startsWith('http')) {
          src = fullUrl(src);
        }
        specifications.images.push(src);
      }
    }
  });
  specifications.images = [...new Set(specifications.images)];

  // Extract features from the correct container path
  // section.characteristics._vr-m-s .characteristics__wrap .characteristics__row
  $('section.characteristics._vr-m-s .characteristics__wrap .characteristics__row').each((_, row) => {
    const nameElement = $(row).find('.characteristics__name');
    const valueElement = $(row).find('.characteristics__property');

    const name = cleanText(nameElement.text());
    let value = cleanText(valueElement.text());

    // Clean up value (remove any "Перейти в глоссарий" text if present)
    value = value.replace(/Перейти в глоссарий/g, '').trim();

    if (name && value) {
      // Store in features array as a formatted string
      specifications.features.push(`${name}: ${value}`);

      // Also store in technical object for structured access
      specifications.technical[name] = value;
    }
  });

  // Extract additional technologies (from glossary links)
  $('a[href*="glossary"]').each((_, link) => {
    const techName = $(link).text().trim();
    if (techName && techName.length > 0 && techName !== 'Перейти в глоссарий') {
      const cleanedTech = cleanText(techName.replace(/™/g, '').replace(/®/g, ''));
      if (cleanedTech.length > 3) {
        specifications.technologies.push(cleanedTech);
      }
    }
  });

  // Also look for technologies in other common containers
  $('.technologies-list li, .tech-item, .product-techs a').each((_, el) => {
    const techText = $(el).text().trim();
    if (techText && techText !== 'Перейти в глоссарий' && !specifications.technologies.includes(techText)) {
      specifications.technologies.push(cleanText(techText));
    }
  });
  specifications.technologies = [...new Set(specifications.technologies)];

  // Extract price from the correct container
  // Price is in .big-price__price span
  const priceElement = $('.big-price__price span').first();
  if (priceElement.length) {
    specifications.price = cleanText(priceElement.text());
  } else {
    // Fallback to other price selectors
    const fallbackPrice = $('.product-price, .price, .current-price').first();
    specifications.price = fallbackPrice.length ? cleanText(fallbackPrice.text()) : null;
  }

  // Extract stock status
  const stockElement = $('.product-stock, .stock, .availability').first();
  specifications.inStock = stockElement.length ? stockElement.text().toLowerCase().includes('в наличии') : false;

  // Extract product code if available
  const codeElement = $('.product-code, .article, .sku').first();
  if (codeElement.length) {
    const codeText = cleanText(codeElement.text());
    const codeMatch = codeText.match(/(\d+)/);
    if (codeMatch) {
      specifications.technical['product_code'] = codeMatch[1];
    }
  }

  // Create the final product object matching your MikroORM entity
  const product: Product = {
    id,
    name,
    type: deviceType,
    model,
    brand,
    description: description || null,
    specifications: specifications
  };

  console.log(`   ✅ Scraped: ${product.name} (${product.model})`);
  console.log(`      Features found: ${specifications.features.length}`);
  console.log(`      Technologies found: ${specifications.technologies.length}`);

  return product;
}

// --- Main Function ---
async function main(): Promise<void> {
  console.log('🚀 Starting scraper for asko-russia.ru');
  const allProductUrls = new Map<string, DeviceType>();

  // Step 1: Gather all product URLs with their device types
  console.log('\n📋 Step 1: Gathering all product URLs...');
  for (const catalogInfo of CATALOG_URLS) {
    const urls = await getAllProductUrlsFromCatalog(catalogInfo);
    urls.forEach(url => {
      allProductUrls.set(url, catalogInfo.type);
    });
  }

  const uniqueUrlsArray = Array.from(allProductUrls.entries());
  console.log(`\n🎯 Total unique product URLs found: ${uniqueUrlsArray.length}`);

  if (uniqueUrlsArray.length === 0) {
    console.log('No product URLs found. Exiting.');
    return;
  }

  // Step 2: Scrape each product
  console.log('\n📦 Step 2: Scraping individual product pages...');
  const scrapedProducts: Product[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < uniqueUrlsArray.length; i++) {
    const [url, deviceType] = uniqueUrlsArray[i];
    console.log(`\n[${i + 1}/${uniqueUrlsArray.length}] Processing (${deviceType})...`);
    const productData = await scrapeProduct(url, deviceType);

    if (productData) {
      scrapedProducts.push(productData);
      successCount++;
    } else {
      failCount++;
    }

    // Save progress every 10 products
    if ((i + 1) % 10 === 0) {
      await fs.writeFile('products_partial.json', JSON.stringify(scrapedProducts, null, 2));
      console.log(`   💾 Partial save: ${scrapedProducts.length} products so far.`);
    }
  }

  // Step 3: Save final results
  console.log('\n💾 Step 3: Saving final results...');
  const outputFile = 'asko_products.json';
  await fs.writeFile(outputFile, JSON.stringify(scrapedProducts, null, 2));

  // Also save in a format that shows the schema
  interface SchemaExample {
    entity_example: {
      id: string;
      name: string;
      type: string;
      model: string;
      brand: string;
      description: string | null;
      specifications: Specifications;
    };
    total_products: number;
    products: Product[];
  }

  const schemaExample: SchemaExample = {
    entity_example: {
      id: "uuid",
      name: "string",
      type: "enum (DeviceType)",
      model: "string",
      brand: "string (Asko)",
      description: "text (optional)",
      specifications: {
        url: "product URL",
        category: DeviceType.UNKNOWN,
        images: ["url1", "url2"],
        features: ["Характеристика 1: значение 1", "Характеристика 2: значение 2"],
        technologies: ["Технология 1", "Технология 2"],
        price: "string or null",
        inStock: true,
        technical: {
          "Характеристика 1": "значение 1",
          "Характеристика 2": "значение 2",
          "product_code": "код товара"
        }
      }
    },
    total_products: scrapedProducts.length,
    products: scrapedProducts
  };

  await fs.writeFile('asko_products_with_schema.json', JSON.stringify(schemaExample, null, 2));

  console.log(`✅ Scraping complete!`);

  // Step 4: Summary
  console.log(`\n📊 Summary:`);
  console.log(`   - Total products scraped successfully: ${successCount}`);
  console.log(`   - Failed products: ${failCount}`);
  console.log(`   - Data saved to: asko_products.json`);
  console.log(`   - Schema example saved to: asko_products_with_schema.json`);

  // Group by device type
  const typeCount: Record<string, number> = {};
  scrapedProducts.forEach(p => {
    typeCount[p.type] = (typeCount[p.type] || 0) + 1;
  });
  console.log(`\n📈 Products by type:`);
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });

  // Show sample of features from first product
  if (scrapedProducts.length > 0) {
    console.log(`\n🔍 Sample features from first product:`);
    const sampleProduct = scrapedProducts[0];
    console.log(`   Product: ${sampleProduct.name}`);
    console.log(`   Features (first 5):`);
    sampleProduct.specifications.features.slice(0, 5).forEach((feature, idx) => {
      console.log(`     ${idx + 1}. ${feature}`);
    });
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
});
