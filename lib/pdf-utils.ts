/**
 * Utilitários para geração de PDFs padronizados da AG Assessoria
 */

import jsPDF from 'jspdf'

export interface PDFHeaderOptions {
  title?: string
  subtitle?: string
  showLogo?: boolean
  headerHeight?: number
}

export const AG_ASSESSORIA_COLORS = {
  primary: [5, 150, 105] as [number, number, number], // emerald-600
  text: [0, 0, 0] as [number, number, number],
  textLight: [100, 100, 100] as [number, number, number],
  textDark: [51, 65, 85] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number]
}

export const AG_ASSESSORIA_LOGO_URL = 'https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/o-h2__8-krHhyceVQM4UJ/image.png'

/**
 * Adiciona cabeçalho padrão da AG Assessoria ao PDF
 */
export function addAGAssessoriaHeader(
  pdf: jsPDF, 
  options: PDFHeaderOptions = {}
): number {
  const {
    title = '',
    subtitle = '',
    showLogo = true,
    headerHeight = 40
  } = options

  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // Fundo do cabeçalho
  pdf.setFillColor(...AG_ASSESSORIA_COLORS.primary)
  pdf.rect(0, 0, pageWidth, headerHeight, 'F')
  
  // Texto do cabeçalho
  pdf.setTextColor(255, 255, 255)
  
  // Nome da empresa
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('AG ASSESSORIA', 20, 18)
  
  // Subtítulo padrão
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('CONTABILIDADE E ASSESSORIA EMPRESARIAL', 20, 27)
  
  // Linha adicional se fornecida
  if (subtitle) {
    pdf.setFontSize(10)
    pdf.text(subtitle, 20, 34)
  }
  
  // Título do documento (fora do cabeçalho)
  if (title) {
    pdf.setTextColor(...AG_ASSESSORIA_COLORS.text)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, 20, headerHeight + 15)
  }
  
  return headerHeight + (title ? 25 : 10) // Retorna a posição Y onde começar o conteúdo
}

/**
 * Adiciona rodapé padrão da AG Assessoria ao PDF
 */
export function addAGAssessoriaFooter(
  pdf: jsPDF, 
  pageNumber?: number, 
  totalPages?: number,
  additionalText?: string
): void {
  const pageHeight = pdf.internal.pageSize.getHeight()
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  pdf.setFontSize(8)
  pdf.setTextColor(...AG_ASSESSORIA_COLORS.textLight)
  
  // Texto da esquerda
  const leftText = additionalText || 'AG Assessoria - Contabilidade e Assessoria Empresarial'
  pdf.text(leftText, 20, pageHeight - 10)
  
  // Número da página (direita)
  if (pageNumber !== undefined) {
    const pageText = totalPages 
      ? `Página ${pageNumber} de ${totalPages}` 
      : `Página ${pageNumber}`
    pdf.text(pageText, pageWidth - 60, pageHeight - 10)
  }
}

/**
 * Adiciona uma caixa de resumo estilizada
 */
export function addSummaryBox(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  content: string[]
): void {
  // Fundo da caixa
  pdf.setFillColor(...AG_ASSESSORIA_COLORS.background)
  pdf.rect(x, y, width, height, 'F')
  
  // Borda da caixa
  pdf.setDrawColor(...AG_ASSESSORIA_COLORS.border)
  pdf.rect(x, y, width, height, 'S')
  
  // Conteúdo
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...AG_ASSESSORIA_COLORS.textDark)
  
  let currentY = y + 8
  content.forEach(line => {
    pdf.text(line, x + 5, currentY)
    currentY += 6
  })
}

/**
 * Adiciona data de geração formatada
 */
export function addGenerationDate(pdf: jsPDF, x: number, y: number): void {
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...AG_ASSESSORIA_COLORS.textLight)
  pdf.text(`Gerado em: ${dateStr}`, x, y)
}

/**
 * Configurações padrão para tabelas
 */
export const DEFAULT_TABLE_STYLES = {
  fontSize: 8,
  headStyles: { 
    fillColor: AG_ASSESSORIA_COLORS.primary,
    textColor: [255, 255, 255] as [number, number, number]
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252] as [number, number, number]
  },
  margin: { top: 20, right: 20, bottom: 20, left: 20 }
}