import { api } from './api';

class ReportService {
  // Generar PDF avanzado
  async generateAdvancedPDF(filters = {}, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (options.includeCharts !== undefined) params.append('includeCharts', options.includeCharts);
      if (options.includeBudgets !== undefined) params.append('includeBudgets', options.includeBudgets);

      const response = await api.get(`/reports/advanced-pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_avanzado_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'PDF generado exitosamente' };
    } catch (error) {
      console.error('Error generando PDF avanzado:', error);
      throw error;
    }
  }

  // Generar Excel avanzado
  async generateAdvancedExcel(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/reports/advanced-excel?${params.toString()}`, {
        responseType: 'blob'
      });

      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_avanzado_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Excel generado exitosamente' };
    } catch (error) {
      console.error('Error generando Excel avanzado:', error);
      throw error;
    }
  }

  // Generar reporte personalizado
  async generateCustomReport(reportData) {
    try {
      const response = await api.post('/reports/custom', reportData, {
        responseType: 'blob'
      });

      // Determinar tipo de archivo y extensión
      const contentType = response.headers['content-type'];
      const isExcel = contentType?.includes('spreadsheetml');
      const extension = isExcel ? 'xlsx' : 'pdf';
      const mimeType = isExcel ? 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
        'application/pdf';

      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = reportData.title ? 
        `${reportData.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${extension}` :
        `reporte_personalizado_${new Date().toISOString().slice(0, 10)}.${extension}`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Reporte personalizado generado exitosamente' };
    } catch (error) {
      console.error('Error generando reporte personalizado:', error);
      throw error;
    }
  }

  // Obtener datos para vista previa
  async getReportData(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/reports/data?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos del reporte:', error);
      throw error;
    }
  }

  // Obtener plantillas de reportes
  async getReportTemplates() {
    try {
      const response = await api.get('/reports/templates');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo plantillas:', error);
      throw error;
    }
  }

  // Validar filtros de fecha
  validateDateFilters(startDate, endDate) {
    const errors = [];
    
    if (startDate && isNaN(Date.parse(startDate))) {
      errors.push('Fecha de inicio inválida');
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      errors.push('Fecha de fin inválida');
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
    
    return errors;
  }

  // Obtener filtros rápidos predefinidos
  getQuickFilters() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    return {
      thisMonth: {
        label: 'Este mes',
        startDate: new Date(year, month, 1).toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10)
      },
      lastMonth: {
        label: 'Mes anterior',
        startDate: new Date(year, month - 1, 1).toISOString().slice(0, 10),
        endDate: new Date(year, month, 0).toISOString().slice(0, 10)
      },
      thisQuarter: {
        label: 'Este trimestre',
        startDate: new Date(year, Math.floor(month / 3) * 3, 1).toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10)
      },
      thisYear: {
        label: 'Este año',
        startDate: new Date(year, 0, 1).toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10)
      },
      lastYear: {
        label: 'Año anterior',
        startDate: new Date(year - 1, 0, 1).toISOString().slice(0, 10),
        endDate: new Date(year - 1, 11, 31).toISOString().slice(0, 10)
      },
      all: {
        label: 'Todo el período',
        startDate: '',
        endDate: ''
      }
    };
  }

  // Formatear período para mostrar en UI
  formatPeriod(startDate, endDate) {
    if (!startDate && !endDate) return 'Todo el período';
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `Desde ${formatDate(startDate)}`;
    } else {
      return `Hasta ${formatDate(endDate)}`;
    }
  }

  // Calcular métricas resumidas
  calculateSummaryMetrics(data) {
    if (!data || !data.summary) return null;
    
    const { totalIncome, totalExpense, transactionCount } = data.summary;
    const netBalance = totalIncome - totalExpense;
    
    return {
      netBalance,
      savingsRate: totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0,
      averageTransaction: transactionCount > 0 ? (totalExpense / transactionCount).toFixed(2) : 0,
      expenseRatio: totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0
    };
  }

  // Generar sugerencias automáticas basadas en los datos
  generateInsights(data) {
    const insights = [];
    
    if (!data || !data.summary) return insights;
    
    const { totalIncome, totalExpense } = data.summary;
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;
    
    // Análisis de balance
    if (netBalance < 0) {
      insights.push({
        type: 'warning',
        title: 'Balance Negativo',
        description: 'Tus gastos superan tus ingresos. Considera revisar y reducir gastos innecesarios.'
      });
    } else if (savingsRate > 20) {
      insights.push({
        type: 'success',
        title: 'Excelente Ahorro',
        description: `Tienes una tasa de ahorro del ${savingsRate.toFixed(1)}%. ¡Sigue así!`
      });
    }
    
    // Análisis por categorías
    if (data.expensesByCategory) {
      const sortedExpenses = Object.entries(data.expensesByCategory)
        .sort(([,a], [,b]) => b - a);
      
      if (sortedExpenses.length > 0) {
        const [topCategory, topAmount] = sortedExpenses[0];
        const percentage = totalExpense > 0 ? (topAmount / totalExpense * 100).toFixed(1) : 0;
        
        if (percentage > 40) {
          insights.push({
            type: 'info',
            title: 'Categoría Dominante',
            description: `El ${percentage}% de tus gastos son en ${topCategory}. Considera si hay oportunidades de optimización.`
          });
        }
      }
    }
    
    // Análisis de presupuestos
    if (data.budgets && data.budgets.length > 0) {
      const overBudget = data.budgets.filter(budget => {
        const spent = data.expensesByCategory[budget.category] || 0;
        return spent > budget.amount;
      });
      
      if (overBudget.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Presupuestos Excedidos',
          description: `Has excedido el presupuesto en ${overBudget.length} categoría${overBudget.length > 1 ? 's' : ''}.`
        });
      }
    }
    
    return insights;
  }
}

export const reportService = new ReportService();