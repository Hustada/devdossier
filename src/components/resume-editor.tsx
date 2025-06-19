'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Download, FileText, Palette, Type, Eye, Edit, AlertTriangle, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateResumeHTML } from '@/lib/resume-templates'

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
  const [savedData, setSavedData] = useState<ResumeData>(initialData)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const [previewHtml, setPreviewHtml] = useState(resumeHtml)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'preview' | 'discard' | null>(null)
  
  // Update preview when component mounts with initial data
  useEffect(() => {
    if (!resumeHtml) {
      setPreviewHtml(generateResumeHTML(initialData))
    }
  }, [resumeHtml, initialData])

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(resumeData) !== JSON.stringify(savedData)

  const updateResumeData = (newData: ResumeData) => {
    setResumeData(newData)
    setPreviewHtml(generateResumeHTML(newData))
  }

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
    updateResumeData(newData)
  }

  const handleColorChange = (color: string) => {
    const newData = { ...resumeData, primaryColor: color }
    updateResumeData(newData)
  }

  const handleEditToggle = () => {
    if (isEditing && hasUnsavedChanges) {
      // Show save dialog if there are unsaved changes
      setPendingAction('preview')
      setShowSaveDialog(true)
    } else {
      // Safe to toggle without losing changes
      setIsEditing(!isEditing)
      if (!isEditing) {
        setActiveTab('editor')
      } else {
        setActiveTab('preview')
      }
    }
  }

  const handleTabChange = (value: string) => {
    if (value === 'preview' && isEditing && hasUnsavedChanges) {
      // Show save dialog when switching to preview with unsaved changes
      setPendingAction('preview')
      setShowSaveDialog(true)
    } else {
      setActiveTab(value)
    }
  }

  const handleSave = () => {
    onSave?.(resumeData)
    setSavedData({ ...resumeData }) // Update saved state
    setIsEditing(false)
    setActiveTab('preview')
    setShowSaveDialog(false)
    setPendingAction(null)
  }

  const handleSaveAndContinue = () => {
    onSave?.(resumeData)
    setSavedData({ ...resumeData })
    
    if (pendingAction === 'preview') {
      setIsEditing(false)
      setActiveTab('preview')
    }
    
    setShowSaveDialog(false)
    setPendingAction(null)
  }

  const handleDiscardAndContinue = () => {
    setResumeData({ ...savedData })
    setPreviewHtml(generateResumeHTML(savedData))
    
    if (pendingAction === 'preview') {
      setIsEditing(false)
      setActiveTab('preview')
    }
    
    setShowSaveDialog(false)
    setPendingAction(null)
  }

  const handleCancelDialog = () => {
    setShowSaveDialog(false)
    setPendingAction(null)
  }

  const handleExportPDF = async () => {
    const filename = `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`
    
    try {
      // Use the original export method which was working
      const { exportResumeFromHTML } = await import('@/lib/pdf-export')
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
            {hasUnsavedChanges && <span className="text-orange-500">*</span>}
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
            <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                  <div className="space-y-6 max-w-2xl mx-auto">
                    {/* Basic Info Section */}
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Basic Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name</label>
                          <input
                            type="text"
                            value={resumeData.name}
                            onChange={(e) => updateResumeData({ ...resumeData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Job Title</label>
                          <input
                            type="text"
                            value={resumeData.title}
                            onChange={(e) => updateResumeData({ ...resumeData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Professional Summary</label>
                          <textarea
                            value={resumeData.summary}
                            onChange={(e) => updateResumeData({ ...resumeData, summary: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Write a brief professional summary highlighting your expertise and achievements..."
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Skills Section */}
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Technical Skills</h3>
                      <div>
                        <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                        <textarea
                          value={resumeData.skills.join(', ')}
                          onChange={(e) => {
                            const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            updateResumeData({ ...resumeData, skills })
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="JavaScript, React, Node.js, Python, AWS..."
                        />
                      </div>
                    </Card>

                    {/* Projects Section */}
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Projects</h3>
                      <div className="space-y-4">
                        {resumeData.projects.map((project, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-lg">Project {index + 1}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newProjects = resumeData.projects.filter((_, i) => i !== index)
                                  updateResumeData({ ...resumeData, projects: newProjects })
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Project Name</label>
                              <input
                                type="text"
                                value={project.name}
                                onChange={(e) => {
                                  const newProjects = [...resumeData.projects]
                                  newProjects[index] = { ...project, name: e.target.value }
                                  updateResumeData({ ...resumeData, projects: newProjects })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Description</label>
                              <textarea
                                value={project.description}
                                onChange={(e) => {
                                  const newProjects = [...resumeData.projects]
                                  newProjects[index] = { ...project, description: e.target.value }
                                  updateResumeData({ ...resumeData, projects: newProjects })
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Technologies</label>
                              <input
                                type="text"
                                value={project.technologies.join(', ')}
                                onChange={(e) => {
                                  const technologies = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                  const newProjects = [...resumeData.projects]
                                  newProjects[index] = { ...project, technologies }
                                  updateResumeData({ ...resumeData, projects: newProjects })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="React, Node.js, MongoDB..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Key Achievements</label>
                              <textarea
                                value={project.achievements.join('\n')}
                                onChange={(e) => {
                                  const achievements = e.target.value.split('\n').filter(s => s.trim())
                                  const newProjects = [...resumeData.projects]
                                  newProjects[index] = { ...project, achievements }
                                  updateResumeData({ ...resumeData, projects: newProjects })
                                }}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="• Increased performance by 40%&#10;• Implemented user authentication&#10;• Built responsive design"
                              />
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newProject = {
                              name: 'New Project',
                              description: '',
                              technologies: [],
                              achievements: [],
                              url: ''
                            }
                            updateResumeData({ ...resumeData, projects: [...resumeData.projects, newProject] })
                          }}
                          className="w-full"
                        >
                          Add Project
                        </Button>
                      </div>
                    </Card>

                    <div className="flex justify-center gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          if (hasUnsavedChanges) {
                            setPendingAction('preview')
                            setShowSaveDialog(true)
                          } else {
                            setIsEditing(false)
                            setActiveTab('preview')
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelDialog}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={handleDiscardAndContinue}>
              Discard Changes
            </Button>
            <Button onClick={handleSaveAndContinue}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}