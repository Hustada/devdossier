import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportToPDF(element: HTMLElement, filename: string = 'resume.pdf'): Promise<void> {
  try {
    // Create a temporary container for the export
    const exportContainer = document.createElement('div')
    exportContainer.innerHTML = element.innerHTML
    exportContainer.style.position = 'absolute'
    exportContainer.style.left = '-9999px'
    exportContainer.style.top = '0'
    exportContainer.style.width = '816px' // Standard letter width at 96 DPI
    exportContainer.style.backgroundColor = 'white'
    exportContainer.style.fontFamily = 'Arial, sans-serif'
    
    document.body.appendChild(exportContainer)
    
    // Generate canvas from the element
    const canvas = await html2canvas(exportContainer, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      width: 816,
      height: exportContainer.scrollHeight
    })
    
    // Remove temporary container
    document.body.removeChild(exportContainer)
    
    // Calculate PDF dimensions (letter size: 8.5" x 11")
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0
    
    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // Save the PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Failed to export PDF:', error)
    throw new Error('Failed to export PDF')
  }
}

export async function exportResumeFromHTML(htmlContent: string, filename: string = 'resume.pdf'): Promise<void> {
  try {
    // Create a temporary iframe to render the HTML
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '816px'
    iframe.style.height = '1056px'
    iframe.style.border = 'none'
    
    document.body.appendChild(iframe)
    
    // Write the HTML content to the iframe
    if (iframe.contentDocument) {
      iframe.contentDocument.open()
      iframe.contentDocument.write(htmlContent)
      iframe.contentDocument.close()
      
      // Wait for the content to load
      await new Promise(resolve => {
        iframe.onload = resolve
        // Fallback timeout
        setTimeout(resolve, 1000)
      })
      
      // Get the body element from the iframe
      const body = iframe.contentDocument.body
      if (body) {
        await exportToPDF(body, filename)
      }
    }
    
    // Clean up
    document.body.removeChild(iframe)
  } catch (error) {
    console.error('Failed to export resume PDF:', error)
    throw new Error('Failed to export resume PDF')
  }
}