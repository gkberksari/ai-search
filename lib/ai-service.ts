import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

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

const STAGE_ID_MAPPING = {
  "sourced": "clooapkdz000dn01scupqzr3h",
  "applied": "clnvoqb87044hmq3w9248rshm", 
  "contacted": "clnvoqb87044imq3wudgbj1xv",
  "interview": "clnvoqb87044jmq3we22j7ovg",
  "evaluation": "clnvoqb87044kmq3wthrs908z",
  "offer": "clnvoqb87044lmq3w5al2s9d6",
  "hired": "clnvoqb87044mmq3wke7woqqq",
  "rejected": "clnvoqb87044nmq3wttmf5144"
};

const CACHE_MAX_SIZE = 50;

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const promptCache = new LRUCache<string, QueryFilter>(CACHE_MAX_SIZE);

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
 * @param prompt 
 * @returns 
 */
function normalizePrompt(prompt: string): string {
  return prompt
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); 
}

/**
 * 
 * @param params 
 * @returns
 */
function normalizeFilterParameters(params: FilterParameter[]): FilterParameter[] {
  return params.map(param => {
    const normalizedParam = { ...param };
    
   
    normalizedParam.name = param.name.toLowerCase();
    
    
    normalizedParam.operator = param.operator.toLowerCase();
    
    
    if (normalizedParam.name === "stage" && normalizedParam.operator === "equals") {
      const stageName = param.filterVariable.toLowerCase();
      if (STAGE_ID_MAPPING[stageName]) {
        normalizedParam.filterVariable = STAGE_ID_MAPPING[stageName];
      } else {
        console.warn(`Unknown stage name: ${param.filterVariable}`);
        
        normalizedParam.filterVariable = STAGE_ID_MAPPING["sourced"];
      }
    }
    
   
    if (normalizedParam.name === "salary") {
      normalizedParam.filterVariable = param.filterVariable.replace(/[^\d.,]/g, '').replace(',', '.');
      
      if (param.filterVariable2) {
        normalizedParam.filterVariable2 = param.filterVariable2.replace(/[^\d.,]/g, '').replace(',', '.');
      }
      
      normalizedParam.salaryCurr = param.salaryCurr?.toUpperCase() || "EUR";
      normalizedParam.salaryPeriod = param.salaryPeriod?.toUpperCase() || "MONTHLY";
    }
    
    if (normalizedParam.name === "address" || normalizedParam.name === "country") {
      normalizedParam.filterVariable = param.filterVariable
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return normalizedParam;
  });
}

export async function generateFilterFromPrompt(
  prompt: string
): Promise<QueryFilter | null> {
  if (!prompt || prompt.trim() === '') {
    console.error("Prompt is empty");
    return null;
  }

  const normalizedPrompt = normalizePrompt(prompt);
  
  if (promptCache.has(normalizedPrompt)) {
    console.log("Cache hit for prompt:", normalizedPrompt);
    return promptCache.get(normalizedPrompt)!;
  }

  try {
    console.log("Generating filter for prompt:", normalizedPrompt);
    
    const result = await model.generateContent(`
      Given the following prompt from a user, generate a structured query filter for a GraphQL API.
      Prompt: "${prompt}"
      
      Return a valid JSON object that follows this structure:
      {
        "filterParameters": [
          {
            "logicalOperator": "AND", // Can be AND, OR
            "name": "fieldName", // Supported fields: salary, fullName, email, address, stage, etc.
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

      For application stage filters:
      - Use name="stage"
      - Use operator="equals"
      - Use filterVariable with the stage NAME (not ID)
      - Available stages: "Sourced", "Applied", "Contacted", "Interview", "Evaluation", "Offer", "Hired", "Rejected"
      
      For example, for "Candidates from Germany with salary above 2000 Euro per month", 
      the filter would include these parameters:
      [
        {
          "logicalOperator": "AND",
          "name": "address",
          "operator": "contains", 
          "filterVariable": "Germany"
        },
        {
          "logicalOperator": "AND",
          "name": "salary",
          "operator": "gte",
          "filterVariable": "2000",
          "salaryCurr": "EUR",
          "salaryPeriod": "MONTHLY"
        }
      ]

      For "Candidates in hired stage", the filter would be:
      [
        {
          "logicalOperator": "AND",
          "name": "stage",
          "operator": "equals", 
          "filterVariable": "Hired"
        }
      ]

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

    parsedFilter.filterParameters = normalizeFilterParameters(parsedFilter.filterParameters);
    
    promptCache.set(normalizedPrompt, parsedFilter);
    
    return parsedFilter;
  } catch (error) {
    console.error("Error generating filter:", error);
    return null;
  }
}


export function clearPromptCache(): void {
  promptCache.clear();
  console.log("Prompt cache cleared");
}

/**
 * @param filter 
 * @returns 
 */
export function explainFilter(filter: QueryFilter): string {
  if (!filter || !filter.filterParameters || filter.filterParameters.length === 0) {
    return "No filter applied";
  }

  const reverseStageMapping: Record<string, string> = {};
  Object.entries(STAGE_ID_MAPPING).forEach(([name, id]) => {
    reverseStageMapping[id] = name;
  });

  const explanations = filter.filterParameters.map((param, index) => {
    let explanation = index === 0 ? "Finding candidates " : `${param.logicalOperator} `;
    
    if (param.name === "stage" && param.operator === "equals") {
      const stageName = reverseStageMapping[param.filterVariable] || param.filterVariable;
      explanation += `in the "${stageName}" stage`;
    } 
    else if (param.name === "salary") {
      const currency = param.salaryCurr || "EUR";
      const period = param.salaryPeriod?.toLowerCase() || "monthly";
      
      if (param.operator === "between") {
        explanation += `with salary between ${param.filterVariable} and ${param.filterVariable2} ${currency}/${period}`;
      } else if (param.operator === "gte") {
        explanation += `with salary at least ${param.filterVariable} ${currency}/${period}`;
      } else if (param.operator === "lte") {
        explanation += `with salary at most ${param.filterVariable} ${currency}/${period}`;
      }
    }
    else if (param.name === "address" || param.name === "country") {
      explanation += `from ${param.filterVariable}`;
    }
    else if (param.name === "fullName" && param.operator === "contains") {
      explanation += `with name containing "${param.filterVariable}"`;
    }
    else {
      explanation += `where ${param.name} ${param.operator} ${param.filterVariable}`;
      if (param.operator === "between" && param.filterVariable2) {
        explanation += ` and ${param.filterVariable2}`;
      }
    }
    
    return explanation;
  });
  
  return explanations.join(" ");
}