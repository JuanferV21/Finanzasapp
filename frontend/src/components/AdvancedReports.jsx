import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  Filter, 
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Eye,
  Sparkles
} from 'lucide-react';
import { reportService } from '../services/reportService';

const AdvancedReports = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [options, setOptions] = useState({
    includeCharts: true,
    includeBudgets: true,
    includeRecommendations: true
  });
  const [loading, setLoading] = useState({
    pdf: false,
    excel: false,
    preview: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customReport, setCustomReport] = useState({
    title: '',
    format: 'pdf'
  });

  const quickFilters = reportService.getQuickFilters();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await reportService.getReportTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  const handleQuickFilter = (filterKey) => {
    const filter = quickFilters[filterKey];
    setFilters({
      startDate: filter.startDate,
      endDate: filter.endDate
    });
  };

  const handleGeneratePDF = async () => {
    setLoading(prev => ({ ...prev, pdf: true }));
    setError('');
    setSuccess('');
    
    try {
      const validationErrors = reportService.validateDateFilters(filters.startDate, filters.endDate);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      await reportService.generateAdvancedPDF(filters, options);
      setSuccess('PDF generado y descargado exitosamente');
    } catch (error) {
      setError(error.response?.data?.message || 'Error generando PDF');
    } finally {
      setLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  const handleGenerateExcel = async () => {
    setLoading(prev => ({ ...prev, excel: true }));
    setError('');
    setSuccess('');
    
    try {
      const validationErrors = reportService.validateDateFilters(filters.startDate, filters.endDate);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      await reportService.generateAdvancedExcel(filters);
      setSuccess('Excel generado y descargado exitosamente');
    } catch (error) {
      setError(error.response?.data?.message || 'Error generando Excel');
    } finally {
      setLoading(prev => ({ ...prev, excel: false }));
    }
  };

  const handleGenerateCustom = async () => {
    if (!customReport.title.trim()) {
      setError('El título del reporte es requerido');
      return;
    }

    setLoading(prev => ({ ...prev, [customReport.format]: true }));
    setError('');
    setSuccess('');
    
    try {
      const validationErrors = reportService.validateDateFilters(filters.startDate, filters.endDate);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      const reportData = {
        title: customReport.title,
        filters,
        ...options,
        format: customReport.format
      };

      await reportService.generateCustomReport(reportData);
      setSuccess(`Reporte personalizado "${customReport.title}" generado exitosamente`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error generando reporte personalizado');
    } finally {
      setLoading(prev => ({ ...prev, [customReport.format]: false }));
    }
  };

  const handlePreview = async () => {
    setLoading(prev => ({ ...prev, preview: true }));
    setError('');
    
    try {
      const validationErrors = reportService.validateDateFilters(filters.startDate, filters.endDate);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      const data = await reportService.getReportData(filters);
      setPreviewData(data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error obteniendo vista previa');
    } finally {
      setLoading(prev => ({ ...prev, preview: false }));
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFilters(template.filters);
      setOptions(template.options);
      setCustomReport(prev => ({ ...prev, title: template.name }));
    }
  };

  const insights = previewData ? reportService.generateInsights(previewData) : [];
  const summaryMetrics = previewData ? reportService.calculateSummaryMetrics(previewData) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Reportes Avanzados</h2>
        </div>
        <p className="text-gray-600">
          Genera reportes profesionales con gráficos de alta calidad, análisis detallado y recomendaciones automáticas.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Configuración */}
        <div className="space-y-6">
          {/* Plantillas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Plantillas Rápidas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de Fecha */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Período
            </h3>
            
            {/* Filtros Rápidos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Período Rápido:</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(quickFilters).map(([key, filter]) => (
                  <button
                    key={key}
                    onClick={() => handleQuickFilter(key)}
                    className="btn-secondary text-xs"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fechas Personalizadas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input"
                />
              </div>
            </div>

            {filters.startDate || filters.endDate ? (
              <div className="mt-3 text-sm text-gray-600">
                Período: {reportService.formatPeriod(filters.startDate, filters.endDate)}
              </div>
            ) : null}
          </div>

          {/* Opciones de Reporte */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contenido del Reporte</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Incluir gráficos y visualizaciones</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeBudgets}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeBudgets: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Incluir análisis de presupuestos</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeRecommendations}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Incluir recomendaciones automáticas</span>
              </label>
            </div>
          </div>

          {/* Reporte Personalizado */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporte Personalizado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del Reporte
                </label>
                <input
                  type="text"
                  value={customReport.title}
                  onChange={(e) => setCustomReport(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Análisis Financiero Q1 2024"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato
                </label>
                <select
                  value={customReport.format}
                  onChange={(e) => setCustomReport(prev => ({ ...prev, format: e.target.value }))}
                  className="select"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <button
                onClick={handleGenerateCustom}
                disabled={loading[customReport.format] || !customReport.title.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading[customReport.format] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Generar Reporte Personalizado
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Acciones y Vista Previa */}
        <div className="space-y-6">
          {/* Botones de Generación */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generar Reportes</h3>
            <div className="space-y-3">
              <button
                onClick={handleGeneratePDF}
                disabled={loading.pdf}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading.pdf ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Generar PDF Avanzado
              </button>
              
              <button
                onClick={handleGenerateExcel}
                disabled={loading.excel}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {loading.excel ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <Table className="h-4 w-4" />
                )}
                Generar Excel Avanzado
              </button>

              <button
                onClick={handlePreview}
                disabled={loading.preview}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {loading.preview ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Vista Previa de Datos
              </button>
            </div>
          </div>

          {/* Vista Previa de Métricas */}
          {summaryMetrics && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métricas Clave
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${summaryMetrics.netBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Balance Neto</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {summaryMetrics.savingsRate}%
                  </div>
                  <div className="text-sm text-gray-600">Tasa de Ahorro</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${summaryMetrics.averageTransaction}
                  </div>
                  <div className="text-sm text-gray-600">Gasto Promedio</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {summaryMetrics.expenseRatio}%
                  </div>
                  <div className="text-sm text-gray-600">Ratio de Gastos</div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Automáticos */}
          {insights.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Insights Automáticos
              </h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      insight.type === 'success' ? 'bg-green-50 border-green-400' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{insight.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;