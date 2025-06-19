import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type AIProvider = 'openai' | 'gemini'

export interface AIServiceConfig {
  provider: AIProvider
  openaiApiKey?: string
  geminiApiKey?: string
}

export class AIService {
  private openai?: OpenAI
  private gemini?: GoogleGenerativeAI
  private provider: AIProvider

  constructor(config: AIServiceConfig) {
    this.provider = config.provider

    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      })
    }

    if (config.geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(config.geminiApiKey)
    }
  }

  async generateText(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  }): Promise<string> {
    const { temperature = 0.7, maxTokens = 2000, systemPrompt } = options || {}

    try {
      if (this.provider === 'openai' && this.openai) {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
        
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt })
        }
        
        messages.push({ role: 'user', content: prompt })

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature,
          max_tokens: maxTokens,
        })

        return completion.choices[0]?.message?.content || ''
      }

      if (this.provider === 'gemini' && this.gemini) {
        const model = this.gemini.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          }
        })

        const fullPrompt = systemPrompt 
          ? `${systemPrompt}\n\n${prompt}`
          : prompt

        const result = await model.generateContent(fullPrompt)
        return result.response.text()
      }

      throw new Error(`No AI provider configured for ${this.provider}`)
    } catch (error) {
      console.error(`AI Service Error (${this.provider}):`, error)
      throw error
    }
  }

  async generateStructuredText<T>(
    prompt: string, 
    schema: string,
    options?: {
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
    }
  ): Promise<T> {
    const systemPrompt = `${options?.systemPrompt || ''}\n\nYou must respond with valid JSON that matches this schema:\n${schema}\n\nDo not include any text outside the JSON response.`
    
    const response = await this.generateText(prompt, {
      ...options,
      systemPrompt,
      temperature: options?.temperature || 0.3 // Lower temperature for structured data
    })

    try {
      return JSON.parse(response) as T
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', response, parseError)
      throw new Error('AI response was not valid JSON')
    }
  }

  // Fallback mechanism - try primary provider, then fallback
  async generateTextWithFallback(
    prompt: string,
    fallbackProvider: AIProvider,
    options?: {
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
    }
  ): Promise<string> {
    try {
      return await this.generateText(prompt, options)
    } catch (primaryError) {
      console.warn(`Primary AI provider (${this.provider}) failed, trying fallback (${fallbackProvider}):`, primaryError)
      
      // Create temporary service with fallback provider
      const fallbackConfig: AIServiceConfig = {
        provider: fallbackProvider,
        openaiApiKey: process.env.OPENAI_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY
      }
      
      const fallbackService = new AIService(fallbackConfig)
      return await fallbackService.generateText(prompt, options)
    }
  }

  async generateTextWithRetry(
    prompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
      maxRetries?: number
      retryDelay?: number
    }
  ): Promise<string> {
    const { maxRetries = 3, retryDelay = 1000, ...generateOptions } = options || {}
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateText(prompt, generateOptions)
      } catch (error) {
        console.warn(`AI request attempt ${attempt} failed:`, error)
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
    
    throw new Error('All retry attempts failed')
  }

  static createDefault(preferredProvider: AIProvider = 'openai'): AIService {
    return new AIService({
      provider: preferredProvider,
      openaiApiKey: process.env.OPENAI_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY
    })
  }

  static createWithFallback(primaryProvider: AIProvider = 'openai'): AIService {
    const fallbackProvider: AIProvider = primaryProvider === 'openai' ? 'gemini' : 'openai'
    
    const service = new AIService({
      provider: primaryProvider,
      openaiApiKey: process.env.OPENAI_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY
    })

    // Override generateText to use fallback by default
    const originalGenerateText = service.generateText.bind(service)
    service.generateText = async (prompt: string, options?: {
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
    }) => {
      try {
        return await originalGenerateText(prompt, options)
      } catch (fallbackError) {
        console.warn(`Primary provider failed, using fallback:`, fallbackError)
        return await service.generateTextWithFallback(prompt, fallbackProvider, options)
      }
    }

    return service
  }
}