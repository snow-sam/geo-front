"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RelatorioVisita } from "@/types/relatorio";

/**
 * Gera um PDF para um relatório de visita individual
 */
export function generateRelatorioPdf(relatorio: RelatorioVisita): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cores do tema
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const textColor: [number, number, number] = [30, 41, 59]; // Slate-800
  const lightBg: [number, number, number] = [241, 245, 249]; // Slate-100

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Visita Técnica", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${formatDate(relatorio.visita?.dataAgendamento ?? "")}`, pageWidth / 2, 30, { align: "center" });

  // Informações do Cliente
  let yPosition = 55;

  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Informações do Cliente", 14, yPosition);

  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ["Cliente", relatorio.visita?.cliente?.nome ?? ""],
      ["Endereço", relatorio.visita?.cliente?.endereco ?? ""],
      ["Data da Visita", formatDate(relatorio.visita?.dataAgendamento ?? "")],
      ["Horário", `${formatTime(relatorio.horarioInicio)}${relatorio.horarioFim ? ` - ${formatTime(relatorio.horarioFim)}` : ""}`],
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, fillColor: lightBg },
      1: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  // Descrição Geral
  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Descrição do Serviço", 14, yPosition);

  yPosition += 8;

  doc.setFillColor(...lightBg);
  const descricaoLines = doc.splitTextToSize(relatorio.descricaoGeral, pageWidth - 28);
  const descricaoHeight = descricaoLines.length * 6 + 10;
  doc.roundedRect(14, yPosition - 2, pageWidth - 28, descricaoHeight, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(descricaoLines, 18, yPosition + 5);

  yPosition += descricaoHeight + 12;

  // Avaliação
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Avaliação do Cliente", 14, yPosition);

  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ["Nota", `${"★".repeat(relatorio.avaliacao)}${"☆".repeat(5 - relatorio.avaliacao)} (${relatorio.avaliacao}/5)`],
      ...(relatorio.observacoesAvaliacao ? [["Observações", relatorio.observacoesAvaliacao]] : []),
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, fillColor: lightBg },
      1: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  // Assinatura
  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Assinatura do Cliente", 14, yPosition);

  yPosition += 5;

  // Adicionar imagem da assinatura
  if (relatorio.assinaturaCliente && relatorio.assinaturaCliente.startsWith("data:image")) {
    try {
      doc.addImage(relatorio.assinaturaCliente, "PNG", 14, yPosition, 80, 40);
      yPosition += 45;
    } catch {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Assinatura não disponível", 14, yPosition + 10);
      yPosition += 15;
    }
  }

  // Linha de separação
  yPosition += 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, yPosition, pageWidth - 14, yPosition);

  // Footer
  yPosition += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Relatório gerado em ${new Date().toLocaleString("pt-BR")} | Sistema RotGo`,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  // Salvar PDF
  const fileName = `relatorio-visita-${relatorio.visita?.cliente?.nome?.replace(/\s+/g, "-").toLowerCase() ?? ""}-${relatorio.visita?.dataAgendamento ?? ""}.pdf`;
  doc.save(fileName);
}

/**
 * Gera um PDF com múltiplos relatórios
 */
export function generateRelatoriosBatchPdf(relatorios: RelatorioVisita[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cores
  const primaryColor: [number, number, number] = [79, 70, 229];
  const textColor: [number, number, number] = [30, 41, 59];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatórios de Visitas Técnicas", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${relatorios.length} relatório(s) | Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 27, { align: "center" });

  // Tabela de relatórios
  doc.setTextColor(...textColor);

  autoTable(doc, {
    startY: 45,
    head: [["Cliente", "Data", "Horário", "Avaliação", "Descrição"]],
    body: relatorios.map((r) => [
      r.visita?.cliente?.nome ?? "",
      formatDate(r.visita?.dataAgendamento ?? ""),
      formatTime(r.horarioInicio),
      `${r.avaliacao}/5`,
      r.descricaoGeral.length > 50 ? `${r.descricaoGeral.substring(0, 50)}...` : r.descricaoGeral,
    ]),
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Sistema RotGo`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Salvar PDF
  const fileName = `relatorios-visitas-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// Helpers
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  return time?.substring(0, 5) || "-";
}

