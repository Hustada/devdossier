import { ResumeData } from '@/components/resume-editor'

export interface ResumeTemplate {
  id: string
  name: string
  description: string
  generateHTML: (data: ResumeData) => string
}

const escapeHtml = (text: string): string => {
  const div = document?.createElement?.('div')
  if (div) {
    div.textContent = text
    return div.innerHTML
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const classicTemplate: ResumeTemplate = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional professional layout',
  generateHTML: (data: ResumeData) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.name)} - Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px 20px; 
      background: white;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      border-bottom: 2px solid ${data.primaryColor};
      padding-bottom: 20px;
    }
    .header h1 { 
      font-size: 2.5em; 
      color: #2c3e50; 
      margin-bottom: 10px;
    }
    .header .title { 
      font-size: 1.2em; 
      color: ${data.primaryColor}; 
      font-weight: 600;
    }
    .section { 
      margin-bottom: 30px; 
    }
    .section h2 { 
      color: #2c3e50; 
      border-bottom: 1px solid #ecf0f1;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 1.4em;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .skill-tag {
      background: ${data.primaryColor};
      color: white;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.9em;
      font-weight: 500;
    }
    .project { 
      margin-bottom: 25px; 
      padding: 20px; 
      border-left: 4px solid ${data.primaryColor};
      background: #f8f9fa;
      border-radius: 0 8px 8px 0;
    }
    .project h3 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    .project-description {
      margin-bottom: 10px;
      color: #555;
    }
    .project-tech {
      color: ${data.primaryColor};
      font-weight: 600;
      font-size: 0.9em;
      margin-bottom: 8px;
    }
    .project-achievements {
      list-style: none;
      padding-left: 0;
    }
    .project-achievements li {
      margin-bottom: 5px;
      padding-left: 20px;
      position: relative;
    }
    .project-achievements li:before {
      content: "▸";
      color: ${data.primaryColor};
      position: absolute;
      left: 0;
    }
    .summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #3498db;
    }
    @media print {
      body { padding: 20px; }
      .project { page-break-inside: avoid; }
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      text-align: center;
      color: #95a5a6;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.name)}</h1>
    <div class="title">${escapeHtml(data.title)}</div>
  </div>
  
  ${data.summary ? `
  <div class="section">
    <div class="summary">
      <h2>Professional Summary</h2>
      <p>${escapeHtml(data.summary)}</p>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>Technical Skills</h2>
    <div class="skills">
      ${data.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Projects</h2>
    ${data.projects.map(project => `
      <div class="project">
        <h3>${escapeHtml(project.name)}</h3>
        ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
        <div class="project-tech">Technologies: ${project.technologies.join(', ')}</div>
        ${project.achievements.length > 0 ? `
          <ul class="project-achievements">
            ${project.achievements.map(achievement => `<li>${escapeHtml(achievement)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>Generated with DevDossier - AI-Powered Developer Resumes</p>
  </div>
</body>
</html>
`
}

export const modernTemplate: ResumeTemplate = {
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary with sidebar',
  generateHTML: (data: ResumeData) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.name)} - Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      background: white;
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      background: ${data.primaryColor};
      color: white;
      width: 300px;
      padding: 40px 30px;
      min-height: 100vh;
    }
    .sidebar h1 {
      font-size: 2em;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .sidebar .title {
      font-size: 1.1em;
      margin-bottom: 30px;
      opacity: 0.9;
    }
    .sidebar .section {
      margin-bottom: 30px;
    }
    .sidebar h2 {
      font-size: 1.2em;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .skills-sidebar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-tag-sidebar {
      background: rgba(255, 255, 255, 0.2);
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .main-content {
      flex: 1;
      padding: 40px;
      max-width: 800px;
    }
    .summary {
      margin-bottom: 40px;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid ${data.primaryColor};
    }
    .summary h2 {
      color: #2c3e50;
      margin-bottom: 15px;
      font-size: 1.4em;
    }
    .project {
      margin-bottom: 30px;
      padding-bottom: 30px;
      border-bottom: 1px solid #e0e0e0;
    }
    .project:last-child {
      border-bottom: none;
    }
    .project h3 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 1.3em;
    }
    .project-tech {
      color: ${data.primaryColor};
      font-weight: 600;
      font-size: 0.9em;
      margin-bottom: 10px;
    }
    .project-achievements {
      list-style: none;
      padding-left: 0;
    }
    .project-achievements li {
      margin-bottom: 8px;
      padding-left: 25px;
      position: relative;
      color: #555;
    }
    .project-achievements li:before {
      content: "•";
      color: ${data.primaryColor};
      position: absolute;
      left: 0;
      font-size: 1.5em;
      line-height: 0.8;
    }
    @media print {
      body { 
        flex-direction: column;
      }
      .sidebar {
        width: 100%;
        min-height: auto;
        padding: 20px;
      }
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      text-align: center;
      color: #95a5a6;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <h1>${escapeHtml(data.name)}</h1>
    <div class="title">${escapeHtml(data.title)}</div>
    
    <div class="section">
      <h2>Skills</h2>
      <div class="skills-sidebar">
        ${data.skills.map(skill => `<span class="skill-tag-sidebar">${escapeHtml(skill)}</span>`).join('')}
      </div>
    </div>
  </div>

  <div class="main-content">
    ${data.summary ? `
    <div class="summary">
      <h2>Professional Summary</h2>
      <p>${escapeHtml(data.summary)}</p>
    </div>
    ` : ''}

    <h2 style="color: #2c3e50; margin-bottom: 30px; font-size: 1.5em;">Featured Projects</h2>
    
    ${data.projects.map(project => `
      <div class="project">
        <h3>${escapeHtml(project.name)}</h3>
        ${project.description ? `<p style="margin-bottom: 10px; color: #555;">${escapeHtml(project.description)}</p>` : ''}
        <div class="project-tech">Technologies: ${project.technologies.join(', ')}</div>
        ${project.achievements.length > 0 ? `
          <ul class="project-achievements">
            ${project.achievements.map(achievement => `<li>${escapeHtml(achievement)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}

    <div class="footer">
      <p>Generated with DevDossier - AI-Powered Developer Resumes</p>
    </div>
  </div>
</body>
</html>
`
}

export const minimalTemplate: ResumeTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean and ATS-friendly',
  generateHTML: (data: ResumeData) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.name)} - Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Georgia', serif; 
      line-height: 1.7; 
      color: #000; 
      max-width: 700px; 
      margin: 0 auto; 
      padding: 40px 20px; 
      background: white;
    }
    .header { 
      margin-bottom: 30px; 
      text-align: center;
    }
    .header h1 { 
      font-size: 2.2em; 
      font-weight: normal;
      margin-bottom: 5px;
      letter-spacing: 1px;
    }
    .header .title { 
      font-size: 1.1em; 
      color: #555;
      font-style: italic;
    }
    .section { 
      margin-bottom: 35px; 
    }
    .section h2 { 
      font-size: 1.3em;
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #000;
    }
    .skills {
      font-size: 0.95em;
      line-height: 1.8;
    }
    .project { 
      margin-bottom: 25px; 
    }
    .project h3 {
      font-size: 1.1em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .project-description {
      margin-bottom: 8px;
      font-size: 0.95em;
    }
    .project-tech {
      font-size: 0.9em;
      font-style: italic;
      color: #555;
      margin-bottom: 8px;
    }
    .project-achievements {
      list-style: none;
      padding-left: 0;
      font-size: 0.95em;
    }
    .project-achievements li {
      margin-bottom: 5px;
      padding-left: 15px;
      position: relative;
    }
    .project-achievements li:before {
      content: "–";
      position: absolute;
      left: 0;
    }
    .summary {
      font-size: 0.95em;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    @media print {
      body { 
        padding: 0;
        font-size: 11pt;
      }
      .section { page-break-inside: avoid; }
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      text-align: center;
      color: #777;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.name)}</h1>
    <div class="title">${escapeHtml(data.title)}</div>
  </div>
  
  ${data.summary ? `
  <div class="section">
    <h2>Summary</h2>
    <div class="summary">${escapeHtml(data.summary)}</div>
  </div>
  ` : ''}

  <div class="section">
    <h2>Technical Skills</h2>
    <div class="skills">${data.skills.join(' • ')}</div>
  </div>

  <div class="section">
    <h2>Projects</h2>
    ${data.projects.map(project => `
      <div class="project">
        <h3>${escapeHtml(project.name)}</h3>
        ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
        <div class="project-tech">${project.technologies.join(', ')}</div>
        ${project.achievements.length > 0 ? `
          <ul class="project-achievements">
            ${project.achievements.map(achievement => `<li>${escapeHtml(achievement)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>Generated with DevDossier</p>
  </div>
</body>
</html>
`
}

export const templates: ResumeTemplate[] = [
  classicTemplate,
  modernTemplate,
  minimalTemplate
]

export function getTemplate(id: string): ResumeTemplate | undefined {
  return templates.find(template => template.id === id)
}

export function generateResumeHTML(data: ResumeData): string {
  const template = getTemplate(data.template) || classicTemplate
  return template.generateHTML(data)
}