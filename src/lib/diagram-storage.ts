export interface DiagramAnalysis {
  id: string
  title: string
  imageUrl: string
  rating: number | null
  firstAnalysis: string | null
  chatHistory: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

class DiagramStorageService {
  private readonly STORAGE_KEY = 'diagram-analyses'
  private readonly MAX_DIAGRAMS = 20 // Limit number of stored diagrams
  private readonly MAX_CHAT_MESSAGES = 50 // Limit chat history per diagram
  private readonly IMAGE_COMPRESSION_QUALITY = 0.7
  private readonly MAX_IMAGE_SIZE = 800 // Max width/height in pixels

  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }

        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        if (width > this.MAX_IMAGE_SIZE || height > this.MAX_IMAGE_SIZE) {
          if (width > height) {
            height = (height / width) * this.MAX_IMAGE_SIZE
            width = this.MAX_IMAGE_SIZE
          } else {
            width = (width / height) * this.MAX_IMAGE_SIZE
            height = this.MAX_IMAGE_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to compressed JPEG
        const compressedUrl = canvas.toDataURL('image/jpeg', this.IMAGE_COMPRESSION_QUALITY)
        resolve(compressedUrl)
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  private calculateStorageSize(): number {
    try {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }
      return totalSize
    } catch {
      return 0
    }
  }

  private cleanupOldDiagrams(diagrams: DiagramAnalysis[]): DiagramAnalysis[] {
    // Sort by updated date (newest first)
    const sorted = [...diagrams].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    // Keep only the most recent diagrams
    return sorted.slice(0, this.MAX_DIAGRAMS)
  }

  private cleanupChatHistory(chatHistory: ChatMessage[]): ChatMessage[] {
    // Keep only the most recent messages
    if (chatHistory.length > this.MAX_CHAT_MESSAGES) {
      return chatHistory.slice(-this.MAX_CHAT_MESSAGES)
    }
    return chatHistory
  }

  getAllDiagrams(): DiagramAnalysis[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const diagrams = JSON.parse(stored)
      return diagrams.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
        chatHistory: d.chatHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
    } catch (error) {
      console.error('Error loading diagrams from storage:', error)
      return []
    }
  }

  getDiagram(id: string): DiagramAnalysis | null {
    const diagrams = this.getAllDiagrams()
    return diagrams.find(d => d.id === id) || null
  }

  async saveDiagram(diagram: DiagramAnalysis): Promise<void> {
    console.log('saveDiagram called with:', { 
      id: diagram.id, 
      title: diagram.title, 
      hasFirstAnalysis: !!diagram.firstAnalysis,
      updatedAt: diagram.updatedAt 
    })
    try {
      let diagrams = this.getAllDiagrams()
      const existingIndex = diagrams.findIndex(d => d.id === diagram.id)
      console.log('Existing diagram index:', existingIndex)
      
      // Compress image if it's a new diagram or image has changed
      let processedDiagram = { ...diagram }
      if (existingIndex === -1 || diagram.imageUrl !== diagrams[existingIndex]?.imageUrl) {
        try {
          processedDiagram = {
            ...processedDiagram,
            imageUrl: await this.compressImage(diagram.imageUrl)
          }
        } catch (error) {
          console.warn('Failed to compress image:', error)
        }
      }

      // Cleanup chat history
      processedDiagram = {
        ...processedDiagram,
        chatHistory: this.cleanupChatHistory(processedDiagram.chatHistory),
        updatedAt: new Date()
      }

      if (existingIndex >= 0) {
        diagrams[existingIndex] = processedDiagram
      } else {
        diagrams.unshift(processedDiagram)
      }

      // Cleanup old diagrams if we exceed the limit
      diagrams = this.cleanupOldDiagrams(diagrams)

      // Try to save
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(diagrams))
        console.log('Successfully saved to localStorage. Saved diagram has title:', processedDiagram.title)
      } catch {
        console.warn('Storage quota exceeded, attempting cleanup...')
        
        // If still failing, progressively remove oldest diagrams
        while (diagrams.length > 1) {
          diagrams.pop() // Remove oldest
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(diagrams))
            console.log(`Storage successful after reducing to ${diagrams.length} diagrams`)
            break
          } catch {
            continue
          }
        }
        
        // If still failing, clear everything except current
        if (diagrams.length === 1) {
          localStorage.clear()
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify([processedDiagram]))
          console.warn('Had to clear all storage to save current diagram')
        }
      }

      // Log storage usage
      const storageSize = this.calculateStorageSize()
      console.log(`Storage used: ${(storageSize / 1024 / 1024).toFixed(2)} MB`)
      
    } catch (error) {
      console.error('Error saving diagram to storage:', error)
      throw error
    }
  }

  deleteDiagram(id: string): void {
    try {
      const diagrams = this.getAllDiagrams()
      const filtered = diagrams.filter(d => d.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting diagram from storage:', error)
    }
  }

  updateChatHistory(diagramId: string, chatHistory: ChatMessage[]): void {
    const diagram = this.getDiagram(diagramId)
    if (diagram) {
      diagram.chatHistory = this.cleanupChatHistory(chatHistory)
      this.saveDiagram(diagram)
    }
  }

  addChatMessage(diagramId: string, message: ChatMessage): void {
    const diagram = this.getDiagram(diagramId)
    if (diagram) {
      diagram.chatHistory.push(message)
      diagram.chatHistory = this.cleanupChatHistory(diagram.chatHistory)
      this.saveDiagram(diagram)
    }
  }

  clearAllStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('Cleared all diagram storage')
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  getStorageInfo(): { used: string, diagrams: number, oldestDate: Date | null } {
    const diagrams = this.getAllDiagrams()
    const storageSize = this.calculateStorageSize()
    const oldestDate = diagrams.length > 0 
      ? new Date(Math.min(...diagrams.map(d => new Date(d.createdAt).getTime())))
      : null
    
    return {
      used: `${(storageSize / 1024 / 1024).toFixed(2)} MB`,
      diagrams: diagrams.length,
      oldestDate
    }
  }
}

export const diagramStorage = new DiagramStorageService()