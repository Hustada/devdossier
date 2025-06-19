'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Download, FileText, Palette, Type, Eye, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateResumeHTML } from '@/lib/resume-templates'
import { exportResumeFromHTML } from '@/lib/pdf-export'

export interface ResumeData {
  name: string
  title: string
  summary: string
  skills: string[]
  projects: {
    name: string
    description: string
    technologies: string[]
    achievements: string[]
    url?: string
  }[]
  template: 'classic' | 'modern' | 'minimal'
  primaryColor: string
}

interface ResumeEditorProps {
  initialData: ResumeData
  resumeHtml: string
  onSave?: (data: ResumeData) => void
  onExport?: (format: 'pdf' | 'docx') => void
}

export function ResumeEditor({ initialData, resumeHtml, onSave, onExport }: ResumeEditorProps) {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const [previewHtml, setPreviewHtml] = useState(resumeHtml)
  
  // Update preview when component mounts with initial data
  useEffect(() => {
    if (!resumeHtml) {
      setPreviewHtml(generateResumeHTML(initialData))
    }
  }, [])

  const templates = [
    { id: 'classic', name: 'Classic', description: 'Traditional professional layout' },
    { id: 'modern', name: 'Modern', description: 'Contemporary with sidebar' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and ATS-friendly' },
  ]

  const colorPresets = [
    { name: 'Professional', color: '#2c3e50' },
    { name: 'DevDossier', color: '#ff6b35' },
    { name: 'Ocean', color: '#3498db' },
    { name: 'Forest', color: '#27ae60' },
    { name: 'Royal', color: '#8e44ad' },
  ]

  const handleTemplateChange = (templateId: string) => {
    const newData = { ...resumeData, template: templateId as ResumeData['template'] }
    setResumeData(newData)
    setPreviewHtml(generateResumeHTML(newData))
  }

  const handleColorChange = (color: string) => {
    const newData = { ...resumeData, primaryColor: color }
    setResumeData(newData)
    setPreviewHtml(generateResumeHTML(newData))
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    if (!isEditing) {
      setActiveTab('editor')
    }
  }

  const handleSave = () => {
    onSave?.(resumeData)
    setIsEditing(false)
    setActiveTab('preview')
  }

  const handleExportPDF = async () => {
    try {
      const filename = `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`
      await exportResumeFromHTML(previewHtml, filename)
      onExport?.('pdf')
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resume Editor</h2>
        <div className="flex gap-3">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={handleEditToggle}
            className="flex items-center gap-2"
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
          <Button
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Template Selector */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Template
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    resumeData.template === template.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Color Picker */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme Color
            </h3>
            <div className="space-y-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => handleColorChange(preset.color)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg border transition-all",
                    resumeData.primaryColor === preset.color
                      ? "border-gray-400"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-sm">{preset.name}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="preview" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="editor" className="flex-1" disabled={!isEditing}>
                  <Type className="w-4 h-4 mr-2" />
                  Editor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="m-0">
                <div className="bg-gray-50 p-8 min-h-[800px]">
                  <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '816px' }}>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full"
                      style={{ height: '1056px', border: 'none' }}
                      title="Resume Preview"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="editor" className="m-0 p-6">
                {isEditing && (
                  <div className="space-y-6">
                    <div className="text-center text-gray-500">
                      <Edit className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Rich text editor coming soon!</p>
                      <p className="text-sm mt-2">You&apos;ll be able to edit your resume content directly here.</p>
                    </div>
                    <div className="flex justify-center">
                      <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}