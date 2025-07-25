const PDFDocument = require('pdfkit');
const Chart = require('chart.js/auto');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

class ReportService {
  constructor() {
    this.colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];
  }

  // Crear gráfico como imagen usando Chart.js
  async createChartImage(type, data, options = {}) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    const chartConfig = {
      type: type,
      data: data,
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 },
              padding: 20
            }
          },
          title: {
            display: !!options.title,
            text: options.title,
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 30 }
          }
        },
        scales: type === 'pie' || type === 'doughnut' ? {} : {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        ...options.chartOptions
      }
    };

    new Chart(ctx, chartConfig);
    return canvas.toBuffer('image/png');
  }

  // Generar datos del reporte
  async generateReportData(userId, filters = {}) {
    const query = { user: userId };
    
    // Aplicar filtros de fecha
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    // Obtener todas las transacciones
    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Resumen general
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Gastos por categoría
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Ingresos por categoría
    const incomesByCategory = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Evolución mensual
    const monthlyData = transactions.reduce((acc, t) => {
      const month = t.date.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = { income: 0, expense: 0 };
      acc[month][t.type] += t.amount;
      return acc;
    }, {});

    // Top transacciones
    const topExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topIncomes = transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Obtener presupuestos si hay filtro de mes
    let budgets = [];
    if (filters.startDate) {
      const month = filters.startDate.slice(0, 7);
      budgets = await Budget.find({ user: userId, month }).sort({ category: 1 });
    }

    return {
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: transactions.length,
        period: this.formatPeriod(filters)
      },
      expensesByCategory,
      incomesByCategory,
      monthlyData,
      topExpenses,
      topIncomes,
      budgets,
      transactions
    };
  }

  // Generar PDF profesional
  async generateAdvancedPDF(userId, filters = {}, options = {}) {
    const data = await this.generateReportData(userId, filters);
    
    // Crear documento PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Header del documento
    this.addPDFHeader(doc, data.summary);

    // Resumen ejecutivo
    this.addExecutiveSummary(doc, data.summary);

    // Gráfico de ingresos vs gastos
    if (data.summary.totalIncome > 0 || data.summary.totalExpense > 0) {
      const pieChartData = {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          data: [data.summary.totalIncome, data.summary.totalExpense],
          backgroundColor: [this.colors[0], this.colors[1]],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      };

      const pieChart = await this.createChartImage('pie', pieChartData, {
        title: 'Distribución de Ingresos vs Gastos'
      });

      doc.addPage();
      doc.fontSize(16).text('Análisis Visual', 50, 50);
      doc.image(pieChart, 50, 80, { width: 500 });
    }

    // Gráfico de gastos por categoría
    if (Object.keys(data.expensesByCategory).length > 0) {
      const categoryLabels = Object.keys(data.expensesByCategory);
      const categoryValues = Object.values(data.expensesByCategory);

      const barChartData = {
        labels: categoryLabels,
        datasets: [{
          label: 'Gastos por Categoría',
          data: categoryValues,
          backgroundColor: this.colors.slice(0, categoryLabels.length),
          borderWidth: 1,
          borderColor: '#FFFFFF'
        }]
      };

      const barChart = await this.createChartImage('bar', barChartData, {
        title: 'Gastos por Categoría',
        chartOptions: {
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });

      doc.addPage();
      doc.fontSize(16).text('Gastos por Categoría', 50, 50);
      doc.image(barChart, 50, 80, { width: 500 });
    }

    // Evolución mensual
    if (Object.keys(data.monthlyData).length > 1) {
      const months = Object.keys(data.monthlyData).sort();
      const incomeData = months.map(m => data.monthlyData[m].income);
      const expenseData = months.map(m => data.monthlyData[m].expense);

      const lineChartData = {
        labels: months.map(m => this.formatMonth(m)),
        datasets: [
          {
            label: 'Ingresos',
            data: incomeData,
            borderColor: this.colors[0],
            backgroundColor: this.colors[0] + '20',
            tension: 0.1
          },
          {
            label: 'Gastos',
            data: expenseData,
            borderColor: this.colors[1],
            backgroundColor: this.colors[1] + '20',
            tension: 0.1
          }
        ]
      };

      const lineChart = await this.createChartImage('line', lineChartData, {
        title: 'Evolución Mensual',
        chartOptions: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });

      doc.addPage();
      doc.fontSize(16).text('Evolución Temporal', 50, 50);
      doc.image(lineChart, 50, 80, { width: 500 });
    }

    // Tabla de top transacciones
    this.addTopTransactionsTable(doc, data);

    // Análisis de presupuestos
    if (data.budgets.length > 0) {
      this.addBudgetAnalysis(doc, data);
    }

    // Recomendaciones automáticas
    this.addRecommendations(doc, data);

    // Footer
    this.addPDFFooter(doc);

    return doc;
  }

  // Métodos auxiliares para el PDF
  addPDFHeader(doc, summary) {
    doc.fontSize(24).fillColor('#1F2937').text('Reporte Financiero Completo', 50, 50);
    doc.fontSize(12).fillColor('#6B7280').text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 50, 80);
    doc.fontSize(14).fillColor('#374151').text(`Período: ${summary.period}`, 50, 100);
    
    // Línea separadora
    doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#E5E7EB').stroke();
  }

  addExecutiveSummary(doc, summary) {
    doc.fontSize(18).fillColor('#1F2937').text('Resumen Ejecutivo', 50, 150);
    
    const y = 180;
    doc.fontSize(12).fillColor('#374151');
    
    doc.text(`Total de Ingresos: $${summary.totalIncome.toLocaleString()}`, 50, y);
    doc.text(`Total de Gastos: $${summary.totalExpense.toLocaleString()}`, 300, y);
    
    const balanceColor = summary.netBalance >= 0 ? '#10B981' : '#EF4444';
    doc.fillColor(balanceColor);
    doc.text(`Balance Neto: $${summary.netBalance.toLocaleString()}`, 50, y + 20);
    
    doc.fillColor('#374151');
    doc.text(`Total de Transacciones: ${summary.transactionCount}`, 300, y + 20);
    
    // Indicadores clave
    doc.fontSize(14).text('Indicadores Clave:', 50, y + 50);
    doc.fontSize(11);
    
    const savingsRate = summary.totalIncome > 0 ? ((summary.netBalance / summary.totalIncome) * 100).toFixed(1) : 0;
    doc.text(`• Tasa de Ahorro: ${savingsRate}%`, 70, y + 75);
    
    const avgTransaction = summary.transactionCount > 0 ? (summary.totalExpense / summary.transactionCount).toFixed(2) : 0;
    doc.text(`• Gasto Promedio por Transacción: $${avgTransaction}`, 70, y + 95);
  }

  addTopTransactionsTable(doc, data) {
    doc.addPage();
    doc.fontSize(16).fillColor('#1F2937').text('Top Transacciones', 50, 50);
    
    // Top gastos
    doc.fontSize(14).text('Mayores Gastos:', 50, 80);
    let y = 100;
    
    data.topExpenses.slice(0, 5).forEach((transaction, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. ${transaction.description}`, 70, y);
      doc.text(`$${transaction.amount.toLocaleString()}`, 400, y);
      doc.text(transaction.date.toLocaleDateString('es-ES'), 480, y);
      y += 20;
    });

    // Top ingresos
    y += 20;
    doc.fontSize(14).text('Mayores Ingresos:', 50, y);
    y += 20;
    
    data.topIncomes.slice(0, 5).forEach((transaction, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. ${transaction.description}`, 70, y);
      doc.text(`$${transaction.amount.toLocaleString()}`, 400, y);
      doc.text(transaction.date.toLocaleDateString('es-ES'), 480, y);
      y += 20;
    });
  }

  addBudgetAnalysis(doc, data) {
    doc.addPage();
    doc.fontSize(16).fillColor('#1F2937').text('Análisis de Presupuestos', 50, 50);
    
    let y = 80;
    data.budgets.forEach(budget => {
      const spent = data.expensesByCategory[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount * 100).toFixed(1) : 0;
      
      doc.fontSize(12).fillColor('#374151');
      doc.text(`${budget.category}:`, 50, y);
      doc.text(`Presupuesto: $${budget.amount.toLocaleString()}`, 200, y);
      doc.text(`Gastado: $${spent.toLocaleString()} (${percentage}%)`, 350, y);
      
      const statusColor = remaining >= 0 ? '#10B981' : '#EF4444';
      doc.fillColor(statusColor);
      doc.text(`Restante: $${remaining.toLocaleString()}`, 500, y);
      
      y += 25;
    });
  }

  addRecommendations(doc, data) {
    doc.addPage();
    doc.fontSize(16).fillColor('#1F2937').text('Recomendaciones Automáticas', 50, 50);
    
    const recommendations = this.generateRecommendations(data);
    let y = 80;
    
    recommendations.forEach((rec, index) => {
      doc.fontSize(11).fillColor('#374151');
      doc.text(`${index + 1}. ${rec}`, 50, y, { width: 500, align: 'left' });
      y += 30;
    });
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    if (data.summary.netBalance < 0) {
      recommendations.push('Tu balance es negativo. Considera reducir gastos o aumentar ingresos.');
    } else if (data.summary.netBalance > 0) {
      recommendations.push('¡Excelente! Tienes un balance positivo. Considera invertir el excedente.');
    }
    
    // Análisis por categorías
    const sortedExpenses = Object.entries(data.expensesByCategory)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedExpenses.length > 0) {
      const topCategory = sortedExpenses[0];
      recommendations.push(`Tu mayor gasto es en ${topCategory[0]} ($${topCategory[1].toLocaleString()}). Revisa si puedes optimizar esta categoría.`);
    }
    
    // Tasa de ahorro
    const savingsRate = data.summary.totalIncome > 0 ? (data.summary.netBalance / data.summary.totalIncome * 100) : 0;
    if (savingsRate < 10) {
      recommendations.push('Tu tasa de ahorro es baja. Intenta ahorrar al menos el 10% de tus ingresos.');
    } else if (savingsRate > 20) {
      recommendations.push('¡Tienes una excelente tasa de ahorro! Mantén este buen hábito.');
    }
    
    return recommendations;
  }

  addPDFFooter(doc) {
    doc.fontSize(8).fillColor('#9CA3AF')
       .text('Reporte generado automáticamente por Dashboard de Finanzas', 50, 750, { align: 'center' });
  }

  formatPeriod(filters) {
    if (filters.startDate && filters.endDate) {
      return `${filters.startDate} al ${filters.endDate}`;
    } else if (filters.startDate) {
      return `Desde ${filters.startDate}`;
    } else if (filters.endDate) {
      return `Hasta ${filters.endDate}`;
    }
    return 'Todos los períodos';
  }

  formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  // Generar Excel avanzado
  async generateAdvancedExcel(userId, filters = {}) {
    const data = await this.generateReportData(userId, filters);
    
    // Implementación de Excel usando xlsx
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // Hoja de resumen
    const summaryData = [
      ['REPORTE FINANCIERO COMPLETO'],
      ['Período:', data.summary.period],
      ['Generado:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['RESUMEN EJECUTIVO'],
      ['Total Ingresos:', data.summary.totalIncome],
      ['Total Gastos:', data.summary.totalExpense],
      ['Balance Neto:', data.summary.netBalance],
      ['Total Transacciones:', data.summary.transactionCount],
      ['Tasa de Ahorro (%):', ((data.summary.netBalance / data.summary.totalIncome) * 100).toFixed(2)]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    
    // Hoja de gastos por categoría
    const expensesData = [
      ['Categoría', 'Monto'],
      ...Object.entries(data.expensesByCategory).map(([cat, amount]) => [cat, amount])
    ];
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Gastos por Categoría');
    
    // Hoja de todas las transacciones
    const transactionsData = [
      ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto'],
      ...data.transactions.map(t => [
        t.date.toLocaleDateString('es-ES'),
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.category,
        t.description,
        t.amount
      ])
    ];
    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transacciones');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = new ReportService();