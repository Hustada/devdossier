import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportToPDF(element: HTMLElement, filename: string = 'resume.pdf'): Promise<void> {
  try {
    // Wait a moment for styles to fully apply
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Generate canvas directly from the provided element with enhanced options
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: false,
      foreignObjectRendering: false,
      width: element.offsetWidth || 816,
      height: element.offsetHeight || element.scrollHeight,
      windowWidth: element.offsetWidth || 816,
      windowHeight: element.offsetHeight || element.scrollHeight,
      onclone: (clonedDoc, clonedElement) => {
        // Force background color rendering
        const style = clonedDoc.createElement('style')
        style.textContent = `
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `
        clonedDoc.head?.appendChild(style)
        
        // Ensure the cloned element maintains its styles
        if (clonedElement && element) {
          const computedStyle = window.getComputedStyle(element)
          clonedElement.style.width = computedStyle.width || '816px'
          clonedElement.style.background = computedStyle.background || 'white'
        }
      }
    })
    
    // Calculate PDF dimensions
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

export async function exportElementToPDF(element: HTMLElement, filename: string = 'resume.pdf'): Promise<void> {
  try {
    // Generate canvas from the element with enhanced options
    const canvas = await html2canvas(element, {
      scale: 3, // Even higher quality for better text rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      foreignObjectRendering: true,
      width: 816,
      height: element.scrollHeight || element.offsetHeight,
      windowWidth: 816,
      windowHeight: element.scrollHeight || element.offsetHeight,
      onclone: (clonedDoc) => {
        // Ensure all styles are properly applied in the cloned document
        const clonedElement = clonedDoc.documentElement || clonedDoc.body
        if (clonedElement) {
          clonedElement.style.background = 'white'
          clonedElement.style.color = '#000'
          
          // Force style recalculation
          const computedStyle = window.getComputedStyle(element)
          clonedElement.style.fontFamily = computedStyle.fontFamily || 'Arial, sans-serif'
        }
      }
    })
    
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
    // Create a temporary iframe to render the HTML properly
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '816px'
    iframe.style.height = '1056px'
    iframe.style.border = 'none'
    iframe.style.background = 'white'
    
    document.body.appendChild(iframe)
    
    // Write the HTML content to the iframe
    if (iframe.contentDocument) {
      iframe.contentDocument.open()
      iframe.contentDocument.write(htmlContent)
      iframe.contentDocument.close()
      
      // Wait for the content to load and styles to be applied
      await new Promise(resolve => {
        iframe.onload = resolve
        // Fallback timeout - increased for better style loading
        setTimeout(resolve, 2000)
      })
      
      // Additional wait for styles and fonts to fully load
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Get the body element from the iframe
      const bodyElement = iframe.contentDocument.body
      if (bodyElement) {
        // Generate canvas with better settings for color preservation
        const canvas = await html2canvas(bodyElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 0,
          removeContainer: false,
          foreignObjectRendering: false,
          width: 816,
          height: bodyElement.scrollHeight || 1056,
          windowWidth: 816,
          windowHeight: bodyElement.scrollHeight || 1056,
          onclone: (clonedDoc) => {
            // Force background color rendering
            const style = clonedDoc.createElement('style')
            style.textContent = `
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            `
            clonedDoc.head?.appendChild(style)
          }
        })
        
        // Calculate PDF dimensions
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
      }
    }
    
    // Clean up
    document.body.removeChild(iframe)
  } catch (error) {
    console.error('Failed to export resume PDF:', error)
    throw new Error('Failed to export resume PDF')
  }
}