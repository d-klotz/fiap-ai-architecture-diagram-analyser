"use client"

import { useState, useCallback, useEffect, Suspense, useRef } from "react"
import { Upload, Edit2 } from "lucide-react"
import { Chat } from "@/components/Chat"
import { Skeleton } from "@/components/ui/skeleton"
import { TypingEffect } from "@/components/TypingEffect"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { DiagramToolbar } from "@/components/DiagramToolbar"
import { ImageSelector } from "@/components/ImageSelector"
import { diagramStorage, DiagramAnalysis, ChatMessage } from "@/lib/diagram-storage"
import { useSearchParams } from "next/navigation"

function HomeContent() {
  const searchParams = useSearchParams()
  const diagramId = searchParams.get('id')

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [title, setTitle] = useState<string>("")
  const [rating, setRating] = useState<number | null>(null)
  const [isLoadingTitle, setIsLoadingTitle] = useState(false)
  const [isInspectMode, setIsInspectMode] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [firstAnalysis, setFirstAnalysis] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setCurrentDiagram] = useState<DiagramAnalysis | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFile = useCallback((file: File) => {
    // Only allow JPEG and PNG formats
    if (file.type === "image/jpeg" || file.type === "image/png") {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string
          setUploadedImage(imageUrl)

          // Create new diagram
          const newDiagram: DiagramAnalysis = {
            id: diagramStorage.generateId(),
            title: "",
            imageUrl,
            rating: null,
            firstAnalysis: null,
            chatHistory: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }

          setCurrentDiagram(newDiagram)
          setChatMessages([])

          // Clear URL params for new diagram
          if (diagramId) {
            window.history.replaceState({}, '', '/')
          }
        }
      }
      reader.readAsDataURL(file)
    } else {
      // Show error for unsupported formats
      alert('Please upload a JPEG or PNG image file only.')
    }
  }, [diagramId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])



  // Load existing diagram if ID is provided
  useEffect(() => {
    if (diagramId) {
      const diagram = diagramStorage.getDiagram(diagramId)
      if (diagram) {
        setCurrentDiagram(diagram)
        setUploadedImage(diagram.imageUrl)
        setTitle(diagram.title)
        setRating(diagram.rating)
        setFirstAnalysis(diagram.firstAnalysis)
        setChatMessages(diagram.chatHistory)
        setSelectedArea(null)
        setIsInspectMode(false)
      }
    } else {
      // Reset state for new diagram
      setCurrentDiagram(null)
      setUploadedImage(null)
      setTitle("")
      setRating(null)
      setFirstAnalysis(null)
      setChatMessages([])
      setSelectedArea(null)
      setIsInspectMode(false)
    }
  }, [diagramId])


  // ESC key handler to disable inspect mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isInspectMode) {
        setIsInspectMode(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isInspectMode])

  const generateTitle = useCallback(async (analysisText: string) => {
    if (!analysisText) return

    setIsLoadingTitle(true)
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisText }),
      })

      if (response.ok) {
        const data = await response.json()
        setTitle(data.title)
        console.log('Generated title:', data.title)

        // Save diagram with title - get current diagram at time of save
        setCurrentDiagram(prevDiagram => {
          if (prevDiagram) {
            console.log('Saving diagram with title:', data.title, 'Diagram ID:', prevDiagram.id)
            const updatedDiagram = {
              ...prevDiagram,
              title: data.title,
              updatedAt: new Date()
            }
            diagramStorage.saveDiagram(updatedDiagram)
              .then(() => {
                console.log('Successfully saved diagram with title')
                // Defer the event dispatch to avoid setState during render
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('diagramsUpdated'))
                }, 0)
              })
              .catch(error => {
                console.error('Failed to save diagram with title:', error)
                alert('Storage is full. Some old diagrams may be removed to make space.')
              })
            return updatedDiagram
          }
          console.warn('No current diagram to update with title')
          return prevDiagram
        })
      }
    } catch (error) {
      console.error('Error generating title:', error)
    } finally {
      setIsLoadingTitle(false)
    }
  }, [])

  useEffect(() => {
    if (!uploadedImage && !diagramId) {
      setTitle("")
      setRating(null)
      setSelectedArea(null)
      setIsInspectMode(false)
      setFirstAnalysis(null)
    }
  }, [uploadedImage, diagramId])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleInspectToggle = () => {
    setIsInspectMode(!isInspectMode)
    if (selectedArea) {
      setSelectedArea(null)
    }
  }


  const handleSelectionComplete = (_selection: any, croppedImage: string) => {
    setSelectedArea(croppedImage)
    setIsInspectMode(false)
  }

  const handleClearSelectedArea = () => {
    setSelectedArea(null)
  }

  const handleRatingUpdate = useCallback((newRating: number) => {
    setRating(newRating)
    setCurrentDiagram(prevDiagram => {
      if (prevDiagram) {
        const updatedDiagram = {
          ...prevDiagram,
          rating: newRating,
          updatedAt: new Date()
        }
        diagramStorage.saveDiagram(updatedDiagram).catch(error => {
          console.error('Failed to save diagram:', error)
        })
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('diagramsUpdated'))
        }, 0)
        return updatedDiagram
      }
      return prevDiagram
    })
  }, [])

  const handleFirstAnalysis = useCallback(async (analysis: string) => {
    setFirstAnalysis(analysis)
    
    // Save the diagram with first analysis
    await new Promise<void>((resolve) => {
      setCurrentDiagram(prevDiagram => {
        if (prevDiagram) {
          const updatedDiagram = {
            ...prevDiagram,
            firstAnalysis: analysis,
            updatedAt: new Date()
          }
          diagramStorage.saveDiagram(updatedDiagram)
            .then(() => {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('diagramsUpdated'))
              }, 0)
              resolve()
            })
            .catch(error => {
              console.error('Failed to save diagram:', error)
              resolve() // Resolve anyway to continue
            })
          return updatedDiagram
        }
        resolve()
        return prevDiagram
      })
    })

    // Generate title from analysis text if we don't have a title yet
    if (!title) {
      generateTitle(analysis)
    }
  }, [title, generateTitle])

  const handleChatUpdate = useCallback((messages: ChatMessage[]) => {
    setChatMessages(messages)
    setCurrentDiagram(prevDiagram => {
      if (prevDiagram) {
        const updatedDiagram = {
          ...prevDiagram,
          chatHistory: messages,
          updatedAt: new Date()
        }
        diagramStorage.saveDiagram(updatedDiagram).catch(error => {
          console.error('Failed to save diagram:', error)
        })
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('diagramsUpdated'))
        }, 0)
        return updatedDiagram
      }
      return prevDiagram
    })
  }, [])

  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true)
    setEditedTitle(title)
    setTimeout(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }, 0)
  }, [title])

  const handleTitleSave = useCallback(() => {
    const trimmedTitle = editedTitle.trim()
    if (trimmedTitle && trimmedTitle !== title) {
      setTitle(trimmedTitle)
      setCurrentDiagram(prevDiagram => {
        if (prevDiagram) {
          const updatedDiagram = {
            ...prevDiagram,
            title: trimmedTitle,
            updatedAt: new Date()
          }
          diagramStorage.saveDiagram(updatedDiagram).catch(error => {
            console.error('Failed to save diagram:', error)
          })
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('diagramsUpdated'))
          }, 0)
          return updatedDiagram
        }
        return prevDiagram
      })
    }
    setIsEditingTitle(false)
  }, [editedTitle, title])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditingTitle(false)
      setEditedTitle(title)
    }
  }, [handleTitleSave, title])

  return (
    <div className="flex h-screen w-full">
      <div className={`${uploadedImage ? 'w-[65%]' : 'w-full'} flex items-center justify-center p-8 transition-all duration-300`}>
        <div className="w-full max-w-3xl h-full">
          {!uploadedImage ? (
            <div
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/20 dark:hover:border-gray-600"
                }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleFileInput}
              />
              <label
                htmlFor="file-upload"
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
              >
                <Upload className="mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drop your architecture diagram here
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  or click to browse
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Supports PNG and JPEG only
                </p>
              </label>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full gap-4">
              {isLoadingTitle ? (
                <div className="flex items-center justify-center gap-3">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ) : title ? (
                <div className="flex items-center justify-center gap-3">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="text-2xl font-bold text-gray-800 dark:text-gray-200 bg-transparent border-b-2 border-blue-500 outline-none px-2"
                    />
                  ) : (
                    <div 
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={handleTitleClick}
                    >
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        <TypingEffect text={title} speed={50} />
                      </h2>
                      <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {rating && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={rating >= 8 ? "default" : rating >= 6 ? "secondary" : "destructive"}
                          className="text-sm cursor-help"
                        >
                          {rating}/10
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Architecture quality rating based on security, design, applicability, and feasibility.
                          <br />
                          <span className="text-green-200">8-10: Excellent</span> •
                          <span className="text-yellow-200"> 6-7: Good</span> •
                          <span className="text-red-200"> 1-5: Needs improvement</span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : null}
              <div className="flex-1 flex flex-col">
                <div className="relative flex-1 w-full">
                  <ImageSelector
                    src={uploadedImage}
                    alt="Architecture diagram"
                    isSelectionMode={isInspectMode}
                    onSelectionComplete={handleSelectionComplete}
                  >
                  </ImageSelector>
                </div>
                <DiagramToolbar
                  isInspectMode={isInspectMode}
                  onInspectToggle={handleInspectToggle}
                  hasAnalysis={!!firstAnalysis}
                  analysisContent={firstAnalysis || undefined}
                  analysisTitle={title || 'Architecture Analysis'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {uploadedImage && (
        <div className="w-[35%] h-full">
          <Chat
            imageUrl={uploadedImage}
            onRatingUpdate={handleRatingUpdate}
            onFirstAnalysis={handleFirstAnalysis}
            selectedArea={selectedArea}
            onClearSelectedArea={handleClearSelectedArea}
            initialMessages={chatMessages}
            onChatUpdate={handleChatUpdate}
          />
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}