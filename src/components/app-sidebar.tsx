"use client"

import {
  Plus,
  Network,
  FileImage,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { diagramStorage, DiagramAnalysis } from "@/lib/diagram-storage"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function AppSidebarContent() {
  const [diagrams, setDiagrams] = useState<DiagramAnalysis[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDiagramId = searchParams.get('id')

  useEffect(() => {
    const loadDiagrams = () => {
      const stored = diagramStorage.getAllDiagrams()
      setDiagrams(stored)
    }

    loadDiagrams()

    // Listen for storage changes
    const handleStorageChange = () => {
      loadDiagrams()
    }

    window.addEventListener('storage', handleStorageChange)
    // Custom event for same-tab updates
    window.addEventListener('diagramsUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('diagramsUpdated', handleStorageChange)
    }
  }, [])

  const handleNewDiagram = () => {
    router.push('/')
  }

  const handleDiagramSelect = (diagramId: string) => {
    router.push(`/?id=${diagramId}`)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <Network className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold">Diagram Analyser</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleNewDiagram}
                className="w-full justify-start px-6 py-3 text-sm hover:bg-gray-200 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-3" />
                New Analysis
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {diagrams.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Recent Analyses
            </SidebarGroupLabel>
            <SidebarMenu>
              {diagrams.map((diagram) => (
                <SidebarMenuItem key={diagram.id}>
                  <SidebarMenuButton
                    onClick={() => handleDiagramSelect(diagram.id)}
                    className={`w-full justify-start px-6 h-14 text-sm my-2 hover:bg-gray-200 rounded-md transition-colors ${currentDiagramId === diagram.id ? 'bg-gray-300 border-l-2 border-black' : ''
                      }`}
                  >
                    <div className="flex items-center w-full gap-3">
                      <FileImage className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate mb-1">
                          {diagram.title || 'Untitled Diagram'}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(diagram.updatedAt)}</span>
                          {diagram.rating && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                              {diagram.rating}/10
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

export function AppSidebar() {
  return (
    <Suspense fallback={<div>Loading sidebar...</div>}>
      <AppSidebarContent />
    </Suspense>
  )
}