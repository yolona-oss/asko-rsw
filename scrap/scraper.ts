import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

// --- Configuration ---
const BASE_URL = 'https://asko-russia.ru';
const REQUEST_DELAY_MS = 1500;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// DeviceType enum matching the DB enum exactly
enum DeviceType {
  WASHING_MACHINE = 'washing_machine',
  DRYER = 'dryer',
  DISHWASHER = 'dishwasher',
  OVEN = 'oven',
  COOKTOP = 'cooktop',
  REFRIGERATOR = 'refrigerator',
  FREEZER = 'freezer',
  HOOD = 'hood',
  OTHER = 'other',
}

interface CatalogInfo {
  url: string;
  type: DeviceType;
}

const CATALOG_URLS: CatalogInfo[] = [
  { url: 'https://asko-russia.ru/catalog/stiralnye_mashiny/', type: DeviceType.WASHING_MACHINE },
  { url: 'https://asko-russia.ru/catalog/sushilnye-mashiny/', type: DeviceType.DRYER },
  { url: 'https://asko-russia.ru/catalog/posudomoechnye_mashiny/', type: DeviceType.DISHWASHER },
  { url: 'https://asko-russia.ru/catalog/dukhovye-shkafy/', type: DeviceType.OVEN },
  { url: 'https://asko-russia.ru/catalog/kompaktnye-dukhovye-shkafy/', type: DeviceType.OVEN },
  { url: 'https://asko-russia.ru/catalog/varochnye-paneli/', type: DeviceType.COOKTOP },
  { url: 'https://asko-russia.ru/catalog/vytyazhki/', type: DeviceType.HOOD },
  { url: 'https://asko-russia.ru/catalog/kholodilniki/', type: DeviceType.REFRIGERATOR },
  { url: 'https://asko-russia.ru/catalog/morozilniki/', type: DeviceType.FREEZER },
  { url: 'https://asko-russia.ru/catalog/complects-asko/domashnyaya-prachechnaya/', type: DeviceType.OTHER },
  { url: 'https://asko-russia.ru/catalog/complects-asko/komplekty-kbt/', type: DeviceType.OTHER },
  { url: 'https://asko-russia.ru/catalog/vakuumatory/', type: DeviceType.OTHER },
  { url: 'https://asko-russia.ru/catalog/podogrevateli_posudy/', type: DeviceType.OTHER },
  { url: 'https://asko-russia.ru/catalog/mikrovolnovye_pechi/', type: DeviceType.OTHER },
  { url: 'https://asko-russia.ru/catalog/kofemashiny/', type: DeviceType.OTHER },
];

// Output format — compatible with POST /devices/import
// The import endpoint reads: specifications.technical → DB specifications,
// specifications.features (object) → DB features, specifications.url → DB link
interface ProductOutput {
  name: string;
  type: DeviceType;
  model: string;
  brand: string;
  description: string | null;
  specifications: {
    url: string;
    technical: Record<string, string>;
    features: Record<string, string>;
    images: string[];
    price: string | null;
  };
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
    console.log(`  Fetching: ${url}`);
    await delay(REQUEST_DELAY_MS);

    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    if (response.status !== 200) {
      console.warn(`  Warning: status ${response.status} for ${url}`);
      return null;
    }
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`  Error fetching ${url}:`, error instanceof Error ? error.message : String(error));
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
  console.log(`\nProcessing catalog: ${catalogInfo.url}`);
  let allUrls: string[] = [];

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

  let maxPageNum = 1;
  if (paginationLinks.length > 0) {
    const pageNumbers = paginationLinks
      .map(link => {
        const match = link.match(/PAGEN_\d+=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num): num is number => num !== null);

    if (pageNumbers.length > 0) {
      maxPageNum = Math.max(...pageNumbers);
      console.log(`  Pagination detected. Max page: ${maxPageNum}`);
    }
  }

  for (let pageNum = 2; pageNum <= maxPageNum; pageNum++) {
    const separator = catalogInfo.url.includes('?') ? '&' : '?';
    const paginatedUrl = `${catalogInfo.url}${separator}PAGEN_1=${pageNum}`;
    console.log(`  Fetching page ${pageNum}...`);
    const pageUrls = await getProductUrlsFromCatalogPage(paginatedUrl);
    allUrls = [...allUrls, ...pageUrls];
  }

  const unique = [...new Set(allUrls)];
  console.log(`  Total unique URLs found: ${unique.length}`);
  return unique;
}

async function scrapeProduct(productUrl: string, deviceType: DeviceType): Promise<ProductOutput | null> {
  console.log(`Scraping: ${productUrl}`);
  const $ = await fetchPage(productUrl);
  if (!$) return null;

  // Extract model from h1 or URL
  let model = extractModelFromUrl(productUrl);
  const h1Text = cleanText($('h1').first().text());
  const modelMatch = h1Text.match(/Asko\s+(\S+)/i);
  if (modelMatch && modelMatch[1]) {
    model = modelMatch[1];
  }

  const name = h1Text || model;
  const brand = 'Asko';

  // Description
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

  // Features/specifications from .characteristics__row
  const technical: Record<string, string> = {};
  $('section.characteristics .characteristics__row').each((_, row) => {
    const featureName = cleanText($(row).find('.characteristics__name').text());
    let featureValue = cleanText($(row).find('.characteristics__property').text());
    featureValue = featureValue.replace(/Перейти в глоссарий/g, '').trim();

    if (featureName && featureValue) {
      technical[featureName] = featureValue;
    }
  });

  // Price from .big-price__price span
  let price: string | null = null;
  const priceElement = $('.big-price__price span').first();
  if (priceElement.length) {
    price = cleanText(priceElement.text());
  } else {
    const fallbackPrice = $('.product-price, .price, .current-price').first();
    price = fallbackPrice.length ? cleanText(fallbackPrice.text()) : null;
  }

  // Images from swiper container on the product page
  const images: string[] = [];
  $('section.product-page-card div.swiper-wrapper img, section.product-page-card div.swiper-wrapper source').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset');
    if (src) {
      // srcset may contain multiple URLs — take the first
      const firstSrc = src.split(',')[0].trim().split(/\s+/)[0];
      if (firstSrc && !firstSrc.includes('data:')) {
        images.push(fullUrl(firstSrc));
      }
    }
  });

  // Also check for slide images via background-image or other img patterns in swiper
  $('section.product-page-card .swiper-slide img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src');
    if (src && !src.includes('data:') && !images.includes(fullUrl(src))) {
      images.push(fullUrl(src));
    }
  });

  const uniqueImages = [...new Set(images)];

  const product: ProductOutput = {
    name,
    type: deviceType,
    model,
    brand,
    description: description || null,
    specifications: {
      url: productUrl,
      technical,
      features: { ...technical }, // same data in features for the import endpoint
      images: uniqueImages,
      price,
    },
  };

  console.log(`  OK: ${name} (${model}) — ${Object.keys(technical).length} specs, ${uniqueImages.length} images`);
  return product;
}

// --- Main Function ---
async function main(): Promise<void> {
  console.log('Starting scraper for asko-russia.ru');
  const allProductUrls = new Map<string, DeviceType>();

  // Step 1: Gather all product URLs
  console.log('\nStep 1: Gathering product URLs...');
  for (const catalogInfo of CATALOG_URLS) {
    const urls = await getAllProductUrlsFromCatalog(catalogInfo);
    urls.forEach(url => {
      allProductUrls.set(url, catalogInfo.type);
    });
  }

  const uniqueUrlsArray = Array.from(allProductUrls.entries());
  console.log(`\nTotal unique product URLs: ${uniqueUrlsArray.length}`);

  if (uniqueUrlsArray.length === 0) {
    console.log('No product URLs found. Exiting.');
    return;
  }

  // Step 2: Scrape each product
  console.log('\nStep 2: Scraping products...');
  const scrapedProducts: ProductOutput[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < uniqueUrlsArray.length; i++) {
    const [url, deviceType] = uniqueUrlsArray[i];
    console.log(`\n[${i + 1}/${uniqueUrlsArray.length}] (${deviceType})`);
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
      console.log(`  Partial save: ${scrapedProducts.length} products`);
    }
  }

  // Step 3: Save results
  console.log('\nStep 3: Saving...');
  await fs.writeFile('asko_products.json', JSON.stringify(scrapedProducts, null, 2));

  console.log(`\nDone!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Output: asko_products.json`);

  // Group by type
  const typeCount: Record<string, number> = {};
  scrapedProducts.forEach(p => {
    typeCount[p.type] = (typeCount[p.type] || 0) + 1;
  });
  console.log(`\nBy type:`);
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
});
