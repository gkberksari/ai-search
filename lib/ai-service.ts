import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Apollo Client örneği
let apolloClient: ApolloClient<any> | null = null;

// Apollo Client'ı başlat
function getApolloClient() {
  if (!apolloClient) {
    apolloClient = new ApolloClient({
      uri: 'https://staging-api.hrpanda.co/graphql',
      cache: new InMemoryCache(),
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
      },
    });
  }
  return apolloClient;
}

// GraphQL sorguları
const GET_STAGES = gql`
  query GetStages {
    getStages {
      id
      name
    }
  }
`;

const GET_JOB_LISTINGS = gql`
  query GetJobListings {
    getMyAllJobListings {
      id
      name
    }
  }
`;

const GET_TAGS = gql`
  query GetTags {
    getTags {
      id
      name
    }
  }
`;

const GET_SKILLS = gql`
  query GetSkills {
    getSkills {
      id
      name
    }
  }
`;

const GET_REJECTED_REASONS = gql`
  query GetRejectedReasons {
    getRejectedReasons {
      id
      name
    }
  }
`;

const GET_UNIVERSITIES = gql`
  query getAllUniversities($page: Int!, $filter: UniversityFilter) {
    getAllUniversities(page: $page, filter: $filter) {
      total
      pages
      universities {
        id
        name
      }
    }
  }
`;

// Önbellek için maksimum öğe sayısı
const CACHE_MAX_SIZE = 50;

// Kullanıcı tanımlı alanları belirle
const USER_DEFINED_FIELDS = [
  "stage", "stag", "aşama", "step", "phase",
  "jobtitle", "job", "position", "role", "pozisyon", "görev", "iş", "title",
  "tag", "etiket", "label", 
  "skill", "beceri", "yetenek", "ability", "skills",
  "rejectedreason", "rejectionreason", "reason",
  "university", "university", "school", "college", "üniversite", "okul"
];

// Kullanıcı tanımlı alanları çekmek için cache yapısı
interface UserDefinedDataCache {
  stages: Record<string, string>; // name -> id
  jobListings: Record<string, string>; // name -> id
  tags: Record<string, string>; // name -> id
  skills: Record<string, string>; // name -> id
  rejectedReasons: Record<string, string>; // name -> id
  universities: Record<string, string>; // name -> id
  lastFetched: number;
}

// Önbellek için LRU (En Az Kullanılan) Map
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Kullanıldığı için yeniden ekleyerek en son kullanılan olarak işaretle
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    // Eğer anahtar zaten varsa, önce onu sil
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Eğer cache doluysa, en eski öğeyi (ilk eklenen) sil
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    // Yeni öğeyi ekle
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Prompt önbelleği
const promptCache = new LRUCache<string, QueryFilter>(CACHE_MAX_SIZE);

// Önbellek süresi (1 saat)
const CACHE_TTL = 60 * 60 * 1000;

// Global önbellek nesnesi
let userDefinedDataCache: UserDefinedDataCache | null = null;

type FilterParameter = {
  logicalOperator: string;
  name: string;
  operator: string;
  filterVariable: string;
  filterVariable2?: string;
  salaryCurr?: string;
  salaryPeriod?: string;
  country?: string;
};

type QueryFilter = {
  filterParameters: FilterParameter[];
  query: string;
  isFavoriteApplicant: boolean;
  jobListingId: null | string;
};

/**
 * Bir alanın kullanıcı tanımlı olup olmadığını kontrol eder
 */
function isUserDefinedField(fieldName: string): boolean {
  if (!fieldName) return false;
  
  const lowerFieldName = fieldName.toLowerCase();
  
  return USER_DEFINED_FIELDS.some(field => 
    lowerFieldName.includes(field.toLowerCase()));
}

/**
 * Kullanıcı girdisini normalize eder
 * @param prompt Kullanıcı sorgusu
 * @returns Normalize edilmiş sorgu
 */
function normalizePrompt(prompt: string): string {
  return prompt
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Fazla boşlukları temizle
}

/**
 * Üniversite verilerini tüm sayfalarından çekmek için yardımcı fonksiyon
 */
async function fetchAllUniversities(client: ApolloClient<any>): Promise<Array<{id: string, name: string}>> {
  const firstPageResult = await client.query({
    query: GET_UNIVERSITIES,
    variables: { 
      page: 1,
      filter: { query: "" } 
    }
  });
  
  const totalPages = firstPageResult.data.getAllUniversities.pages;
  const firstPageUnis = firstPageResult.data.getAllUniversities.universities;
  
  // Eğer sadece bir sayfa varsa, doğrudan döndür
  if (totalPages <= 1) {
    return firstPageUnis;
  }
  
  // En fazla ilk 5 sayfayı çek (50 üniversite)
  // Not: Tüm sayfaları çekmek API'ye fazla yük getirebilir
  const maxPages = Math.min(totalPages, 5);
  
  // Diğer sayfaları çek (2. sayfadan başla)
  const otherPagesPromises = [];
  for (let page = 2; page <= maxPages; page++) {
    otherPagesPromises.push(
      client.query({
        query: GET_UNIVERSITIES,
        variables: { 
          page: page,
          filter: { query: "" } 
        }
      })
    );
  }
  
  // Tüm sayfaları paralel olarak çek
  const otherPagesResults = await Promise.all(otherPagesPromises);
  
  // Sonuçları birleştir
  const allUniversities = [...firstPageUnis];
  
  for (const result of otherPagesResults) {
    allUniversities.push(...result.data.getAllUniversities.universities);
  }
  
  return allUniversities;
}

/**
 * Kullanıcı tanımlı verileri çek ve önbelleğe al
 */
export async function fetchUserDefinedData(): Promise<UserDefinedDataCache> {
  // Eğer güncel önbellek varsa, onu kullan
  if (userDefinedDataCache && 
      (Date.now() - userDefinedDataCache.lastFetched) < CACHE_TTL) {
    return userDefinedDataCache;
  }
  
  // Apollo Client'ı al
  const client = getApolloClient();
  
  try {
    // Temel verileri paralel olarak çek
    const [stagesRes, jobListingsRes, tagsRes, skillsRes, rejectedReasonsRes] = await Promise.all([
      client.query({ query: GET_STAGES }),
      client.query({ query: GET_JOB_LISTINGS }),
      client.query({ query: GET_TAGS }),
      client.query({ query: GET_SKILLS }),
      client.query({ query: GET_REJECTED_REASONS })
    ]);
    
    // Üniversiteleri ayrıca çek (birden çok sayfa olabilir)
    const universities = await fetchAllUniversities(client);
    
    // İsim -> ID eşleştirme map'leri oluştur
    const stagesMap: Record<string, string> = {};
    stagesRes.data.getStages.forEach((stage: {id: string, name: string}) => {
      stagesMap[stage.name.toLowerCase()] = stage.id;
    });
    
    const jobListingsMap: Record<string, string> = {};
    jobListingsRes.data.getMyAllJobListings.forEach((job: {id: string, name: string}) => {
      jobListingsMap[job.name.toLowerCase()] = job.id;
    });
    
    const tagsMap: Record<string, string> = {};
    tagsRes.data.getTags.forEach((tag: {id: string, name: string}) => {
      tagsMap[tag.name.toLowerCase()] = tag.id;
    });
    
    const skillsMap: Record<string, string> = {};
    skillsRes.data.getSkills.forEach((skill: {id: string, name: string}) => {
      skillsMap[skill.name.toLowerCase()] = skill.id;
    });
    
    const rejectedReasonsMap: Record<string, string> = {};
    rejectedReasonsRes.data.getRejectedReasons.forEach((reason: {id: string, name: string}) => {
      rejectedReasonsMap[reason.name.toLowerCase()] = reason.id;
    });
    
    const universitiesMap: Record<string, string> = {};
    universities.forEach((uni: {id: string, name: string}) => {
      universitiesMap[uni.name.toLowerCase()] = uni.id;
    });
    
    // Önbelleği güncelle
    userDefinedDataCache = {
      stages: stagesMap,
      jobListings: jobListingsMap,
      tags: tagsMap,
      skills: skillsMap,
      rejectedReasons: rejectedReasonsMap,
      universities: universitiesMap,
      lastFetched: Date.now()
    };
    
    console.log("User defined data fetched:", {
      stages: Object.keys(stagesMap).length,
      jobListings: Object.keys(jobListingsMap).length,
      tags: Object.keys(tagsMap).length,
      skills: Object.keys(skillsMap).length,
      rejectedReasons: Object.keys(rejectedReasonsMap).length,
      universities: Object.keys(universitiesMap).length
    });
    
    return userDefinedDataCache;
  } catch (error) {
    console.error("Error fetching user defined data:", error);
    // Eğer önceki önbellek varsa, hatada bile onu kullan
    if (userDefinedDataCache) {
      return userDefinedDataCache;
    }
    // Yoksa boş bir önbellek döndür
    return {
      stages: {},
      jobListings: {},
      tags: {},
      skills: {},
      rejectedReasons: {},
      universities: {},
      lastFetched: Date.now()
    };
  }
}

/**
 * İsim -> ID eşleştirmesi yap
 */
export async function resolveUserDefinedField(fieldType: string, fieldValue: string): Promise<string | null> {
  try {
    const cache = await fetchUserDefinedData();
    
    const normalizedValue = fieldValue.toLowerCase();
    
    // Alan tipine göre doğru map'i seç
    if (fieldType.includes('stage')) {
      return cache.stages[normalizedValue] || null;
    }
    else if (fieldType.includes('job') || 
             fieldType.includes('title') || 
             fieldType.includes('position') ||
             fieldType.includes('listing')) {
      return cache.jobListings[normalizedValue] || null;
    }
    else if (fieldType.includes('tag')) {
      return cache.tags[normalizedValue] || null;
    }
    else if (fieldType.includes('skill')) {
      return cache.skills[normalizedValue] || null;
    }
    else if (fieldType.includes('reason') || 
             fieldType.includes('rejection')) {
      return cache.rejectedReasons[normalizedValue] || null;
    }
    else if (fieldType.includes('university') || 
             fieldType.includes('school') || 
             fieldType.includes('college') ||
             fieldType.includes('üniversite') ||
             fieldType.includes('okul')) {
      return cache.universities[normalizedValue] || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error resolving user defined field: ${fieldType} - ${fieldValue}`, error);
    return null;
  }
}

/**
 * Tek bir filtreyi normalize eder
 */
function normalizeFilterParameter(param: FilterParameter): FilterParameter {
  const normalizedParam = { ...param };
  
  // Alan adını küçük harfe dönüştür
  normalizedParam.name = normalizedParam.name.toLowerCase();
  
  // Operatörleri düzenli hale getir
  normalizedParam.operator = normalizedParam.operator.toLowerCase();
  
  // Cinsiyet filtresi normalizasyonu
  if (normalizedParam.name === "gender" || 
      normalizedParam.name === "sex" || 
      normalizedParam.name === "genders") {
    
    normalizedParam.name = "gender"; // API'nin beklediği kesin alan adı
    
    // Cinsiyet değerini normalleştir
    const genderValue = (normalizedParam.filterVariable || "").toLowerCase();
    
    // Farklı ifadeleri destekle: kadın, bayan, kız, female, woman...
    if (genderValue.includes("kad") || genderValue.includes("bay") || 
        genderValue.includes("kız") || genderValue.includes("kiz") || 
        genderValue.includes("female") || genderValue.includes("woman") || 
        genderValue.includes("f")) {
      normalizedParam.filterVariable = "Female";
    } 
    // Farklı ifadeleri destekle: erkek, bay, male, man...
    else if (genderValue.includes("erk") || genderValue.includes("bay") || 
             genderValue.includes("male") || genderValue.includes("man") || 
             genderValue.includes("m")) {
      normalizedParam.filterVariable = "Male";
    }
    // Diğer cinsiyet için
    else if (genderValue.includes("other") || genderValue.includes("diğer") || 
             genderValue.includes("diger") || genderValue.includes("non")) {
      normalizedParam.filterVariable = "Other";
    }
    else {
      console.warn(`Unknown gender value: ${normalizedParam.filterVariable}`);
      // Varsayılan olarak değeri olduğu gibi bırak, API hata döndürebilir
    }
  }
  
  // Deneyim süresi filtresi normalizasyonu
  if (normalizedParam.name === "experience" || 
      normalizedParam.name === "exp" || 
      normalizedParam.name === "experienceyears" || 
      normalizedParam.name === "yearsofexperience") {
    
    normalizedParam.name = "experience"; // API'nin beklediği kesin alan adı
    
    // Sayısal değerleri temizle (yıl, ay, gün gibi birimlerden arındır)
    normalizedParam.filterVariable = (normalizedParam.filterVariable || "")
      .replace(/[^\d.,]/g, '')
      .replace(/,/g, '.');
    
    if (normalizedParam.filterVariable2) {
      normalizedParam.filterVariable2 = normalizedParam.filterVariable2
        .replace(/[^\d.,]/g, '')
        .replace(/,/g, '.');
    }
    
    // Varsayılan operator'ü belirle
    if (!normalizedParam.operator || normalizedParam.operator === "") {
      normalizedParam.operator = "equals";
    }
  }
  
  // Maaş filtreleri için sayısal değerleri düzenle
  if (normalizedParam.name === "salary") {
    // Sayısal olmayan karakterleri temizle (ama nokta ve virgül gibi noktalama işaretlerini tut)
    normalizedParam.filterVariable = (normalizedParam.filterVariable || "")
      .replace(/[^\d.,]/g, '')
      .replace(/,/g, '.');
    
    if (normalizedParam.filterVariable2) {
      normalizedParam.filterVariable2 = normalizedParam.filterVariable2
        .replace(/[^\d.,]/g, '')
        .replace(/,/g, '.');
    }
    
    // Para birimi ve periyod için varsayılan değerler belirle
    normalizedParam.salaryCurr = (normalizedParam.salaryCurr || "EUR").toUpperCase();
    normalizedParam.salaryPeriod = (normalizedParam.salaryPeriod || "MONTHLY").toUpperCase();
  }
  
  // Adres/konum filtresi için
  if (normalizedParam.name === "address" || normalizedParam.name === "country") {
    // İlk harfi büyük diğerlerini küçük yap (Title Case)
    normalizedParam.filterVariable = (normalizedParam.filterVariable || "")
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return normalizedParam;
}

export async function generateFilterFromPrompt(
  prompt: string
): Promise<QueryFilter | null> {
  if (!prompt || prompt.trim() === '') {
    console.error("Prompt is empty");
    return null;
  }

  // Sorguyu normalize et
  const normalizedPrompt = normalizePrompt(prompt);
  
  // Önbellekte varsa oradan döndür
  if (promptCache.has(normalizedPrompt)) {
    console.log("Cache hit for prompt:", normalizedPrompt);
    const cachedResult = promptCache.get(normalizedPrompt);
    if (cachedResult) {
      return cachedResult;
    }
  }

  try {
    console.log("Generating filter for prompt:", normalizedPrompt);
    
    // AI sorgusu için prompt
    const result = await model.generateContent(`
      Given the following prompt from a user, generate a structured query filter for a GraphQL API.
      Prompt: "${prompt}"
      
      Return a valid JSON object that follows this structure:
      {
        "filterParameters": [
          {
            "logicalOperator": "AND", // Can be AND, OR
            "name": "fieldName", // Supported fields: salary, fullName, email, address, gender, experience etc.
            "operator": "operatorType", // Can be: equals, contains, between, gte, lte
            "filterVariable": "value1",
            "filterVariable2": "value2", // Only needed for 'between' operator
            "salaryCurr": "currencyCode", // Only for salary - USD, EUR, etc.
            "salaryPeriod": "period" // Only for salary - MONTHLY, YEARLY, etc.
          }
        ],
        "query": "", // Should be empty string
        "isFavoriteApplicant": false, // Set to true only if prompt explicitly mentions favorites
        "jobListingId": null // Should be null
      }

      Important operator mappings:
      - For greater than: use "gte" (not "greaterThan")
      - For less than: use "lte" (not "lessThan")
      - For equality: use "equals"
      - For contains: use "contains"
      - For between: use "between" (requires both filterVariable and filterVariable2)

      For location filters:
      - If the user mentions a country (e.g., "Germany"), use name="address", operator="contains", filterVariable="Germany"

      For salary filters:
      - Always use name="salary" 
      - Include salaryCurr (e.g., "EUR") and salaryPeriod (e.g., "MONTHLY" or "YEARLY")
      - For ranges, use operator="between" with filterVariable and filterVariable2
      - For minimums, use operator="gte" with filterVariable
      - For maximums, use operator="lte" with filterVariable

      For gender filters:
      - Use name="gender" 
      - Use operator="equals"
      - Use filterVariable with either "Male" or "Female" or "Other"

      For experience filters:
      - Use name="experience" 
      - Use appropriate operator: "equals", "gte", "lte", or "between"
      - Use filterVariable with the number of years of experience

      For user defined fields:
      - For STAGE filters: Use name="stage", operator="equals", and filterVariable with the EXACT NAME (e.g., "Sourced", "Applied")
      - For JOB TITLE filters: Use name="jobTitle", operator="equals", and filterVariable with the EXACT NAME (e.g., "Sales Associate")
      - For TAG filters: Use name="tag", operator="equals", and filterVariable with the EXACT NAME of the tag
      - For SKILL filters: Use name="skill", operator="equals", and filterVariable with the EXACT NAME of the skill
      - For UNIVERSITY filters: Use name="university", operator="equals", and filterVariable with the EXACT NAME of the university (e.g., "Marmara University")
      - For REASON filters: Use name="reason", operator="equals", and filterVariable with the EXACT NAME of the reason (e.g., "Not a good fit", "No response")
      Return ONLY the structured JSON without any explanations or preamble.
    `);

    const text = result.response.text();

    if (!text) {
      console.error("No response text from AI");
      return null;
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      return null;
    }

    const jsonStr = jsonMatch[0];
    let parsedFilter: QueryFilter;
    
    try {
      parsedFilter = JSON.parse(jsonStr) as QueryFilter;
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.log("JSON string:", jsonStr);
      return null;
    }

    // Önbelleğe almadan önce kullanıcı tanımlı alanları çözümle
    if (parsedFilter.filterParameters && parsedFilter.filterParameters.length > 0) {
      const resolvedParams = [];
      
      // Her parametre için uygun işlem yap
      for (const param of parsedFilter.filterParameters) {
        // Parametre geçerlilik kontrolü
        if (!param || !param.name) continue;
        
        // Kullanıcı tanımlı alan mı kontrol et
        if (isUserDefinedField(param.name)) {
          const fieldType = param.name;
          const fieldValue = param.filterVariable;
          
          // Eğer fieldValue doluysa
          if (fieldValue) {
            try {
              // API'den ID'yi çöz
              const resolvedId = await resolveUserDefinedField(fieldType, fieldValue);
              
              if (resolvedId) {
                // ID bulunduysa güncelle
                console.log(`Resolved user defined field: ${fieldType} "${fieldValue}" -> ${resolvedId}`);
                
                // Klonlanmış parametre oluştur ve ID'yi ata
                const newParam = { ...param };
                newParam.filterVariable = resolvedId;
                
                // Field adını normalize et
                if (fieldType.includes('stage')) {
                  newParam.name = "stage";
                }
                else if (fieldType.includes('job') || 
                        fieldType.includes('title') || 
                        fieldType.includes('position')) {
                  newParam.name = "jobTitle";
                }
                else if (fieldType.includes('tag')) {
                  newParam.name = "tag";
                }
                else if (fieldType.includes('skill')) {
                  newParam.name = "skill";
                }
                else if (fieldType.includes('university') || 
                         fieldType.includes('school') || 
                         fieldType.includes('college')) {
                  newParam.name = "university";
                }
                
                resolvedParams.push(newParam);
              } else {
                console.warn(`Could not resolve user defined field: ${fieldType} "${fieldValue}"`);
                // Bu alanı fullName araması olarak ekle
                if (parsedFilter.query) {
                  parsedFilter.query += ` ${fieldValue}`;
                } else {
                  parsedFilter.query = fieldValue;
                }
              }
            } catch (error) {
              console.error("Error resolving field:", error);
              // Hata durumunda da fullName araması olarak ekle
              if (parsedFilter.query) {
                parsedFilter.query += ` ${fieldValue}`;
              } else {
                parsedFilter.query = fieldValue;
              }
            }
          }
        } else {
          // Standart bir alan, normalize et ve ekle
          resolvedParams.push(normalizeFilterParameter(param));
        }
      }
      
      // Güncellenmiş parametre listesini kullan
      parsedFilter.filterParameters = resolvedParams;
    }
    
    // Önbelleğe al
    promptCache.set(normalizedPrompt, parsedFilter);
    
    return parsedFilter;
  } catch (error) {
    console.error("Error generating filter:", error);
    return null;
  }
}

/**
 * Önbelleği temizler
 */
export function clearPromptCache(): void {
  promptCache.clear();
  console.log("Prompt cache cleared");
}

/**
 * AI tarafından oluşturulan filtreyi geliştirici için okunabilir formata dönüştürür
 * @param filter Oluşturulan filtre
 * @returns Okunabilir filtre açıklaması
 */
export function explainFilter(filter: QueryFilter): string {
  if (!filter || !filter.filterParameters || filter.filterParameters.length === 0 && !filter.query) {
    return "No filter applied";
  }

  let explanation = "Finding candidates ";
  
  // filterParameters'daki standart filtreleri açıkla
  if (filter.filterParameters && filter.filterParameters.length > 0) {
    const explanations = filter.filterParameters.map((param, index) => {
      let partExplanation = index === 0 ? "" : `${param.logicalOperator} `;
      
      if (param.name === "gender" && param.operator === "equals") {
        if (param.filterVariable === "Female") {
          partExplanation += "who are female";
        } else if (param.filterVariable === "Male") {
          partExplanation += "who are male";
        } else if (param.filterVariable === "Other") {
          partExplanation += "who are non-binary";
        } else {
          partExplanation += `with gender ${param.filterVariable}`;
        }
      }
      else if (param.name === "experience") {
        if (param.operator === "equals") {
          partExplanation += `with exactly ${param.filterVariable} year${param.filterVariable === "1" ? "" : "s"} of experience`;
        } 
        else if (param.operator === "gte") {
          partExplanation += `with at least ${param.filterVariable} year${param.filterVariable === "1" ? "" : "s"} of experience`;
        } 
        else if (param.operator === "lte") {
          partExplanation += `with at most ${param.filterVariable} year${param.filterVariable === "1" ? "" : "s"} of experience`;
        } 
        else if (param.operator === "between" && param.filterVariable2) {
          partExplanation += `with ${param.filterVariable}-${param.filterVariable2} years of experience`;
        }
        else {
          partExplanation += `with experience ${param.operator} ${param.filterVariable}`;
        }
      }
      else if (param.name === "salary") {
        const currency = param.salaryCurr || "EUR";
        const period = (param.salaryPeriod || "MONTHLY").toLowerCase();
        
        if (param.operator === "between" && param.filterVariable2) {
          partExplanation += `with salary between ${param.filterVariable} and ${param.filterVariable2} ${currency}/${period}`;
        } else if (param.operator === "gte") {
          partExplanation += `with salary at least ${param.filterVariable} ${currency}/${period}`;
        } else if (param.operator === "lte") {
          partExplanation += `with salary at most ${param.filterVariable} ${currency}/${period}`;
        } else {
          partExplanation += `with salary ${param.operator} ${param.filterVariable} ${currency}/${period}`;
        }
      }
      else if (param.name === "address" || param.name === "country") {
        partExplanation += `from ${param.filterVariable}`;
      }
      else if (param.name === "fullName" && param.operator === "contains") {
        partExplanation += `with name containing "${param.filterVariable}"`;
      }
      else if (param.name === "stage") {
        partExplanation += `in stage with ID ${param.filterVariable}`;
      }
      else if (param.name === "jobTitle") {
        partExplanation += `applying for job with ID ${param.filterVariable}`;
      }
      else if (param.name === "tag") {
        partExplanation += `tagged with ID ${param.filterVariable}`;
      }
      else if (param.name === "skill") {
        partExplanation += `having skill with ID ${param.filterVariable}`;
      }
      else if (param.name === "university") {
        partExplanation += `from university with ID ${param.filterVariable}`;
      }
      else {
        partExplanation += `where ${param.name} ${param.operator} ${param.filterVariable}`;
        if (param.operator === "between" && param.filterVariable2) {
          partExplanation += ` and ${param.filterVariable2}`;
        }
      }
      
      return partExplanation;
    });
    
    explanation += explanations.join(" ");
  }
  
  // query değerini açıkla (kullanıcı tanımlı alanlar için)
  if (filter.query && filter.query.trim() !== "") {
    const queryTerms = filter.query.trim();
    
    // filterParameters boşsa veya doluysa farklı başlangıç
    if (filter.filterParameters && filter.filterParameters.length > 0) {
      explanation += ` AND matching text search "${queryTerms}"`;
    } else {
      explanation += `matching text search "${queryTerms}"`;
    }
  }
  
  return explanation.trim();
}