import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { goalService } from '../services/api';
import { contributionService } from '../services/api';
import { differenceInMonths, parseISO, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { pushService } from '../services/api';
import PageHeader from '../components/PageHeader';

const initialForm = {
  nombre: '',
  montoObjetivo: '',
  montoAhorrado: '',
  fechaLimite: '',
  notas: '',
};

const LOGROS = [
  { key: 'first_goal', label: '¡Primera meta creada!', desc: 'Has creado tu primera meta de ahorro.', emoji: '🌱' },
  { key: 'first_achieved', label: '¡Primera meta alcanzada!', desc: 'Has alcanzado una meta de ahorro. ¡Felicidades!', emoji: '🏁' },
  { key: 'three_achieved', label: '¡3 metas alcanzadas!', desc: 'Has alcanzado 3 metas de ahorro. ¡Eres constante!', emoji: '🥉' },
  { key: 'three_contributions_month', label: '¡3 aportes en un mes!', desc: 'Has hecho 3 aportes en un mismo mes. ¡Buen ritmo!', emoji: '📅' },
  { key: 'early_achiever', label: '¡Meta alcanzada antes de la fecha límite!', desc: 'Lograste una meta antes de la fecha límite. ¡Te adelantaste!', emoji: '⏰' },
  { key: 'big_contribution', label: '¡Aporte gigante!', desc: 'Registraste un aporte de más de $500. ¡Wow!', emoji: '💰' },
  { key: 'goal_1000', label: '¡Meta de $1000!', desc: 'Alcanzaste una meta con más de $1000 ahorrado.', emoji: '💎' },
  { key: 'six_months_saving', label: '¡6 meses seguidos ahorrando!', desc: 'Has hecho aportes durante 6 meses consecutivos.', emoji: '📈' },
];

function getUnlockedAchievements(goals, allContributions) {
  const unlocked = [];
  if (goals.length > 0) unlocked.push('first_goal');
  if (goals.some(g => g.montoAhorrado >= g.montoObjetivo)) unlocked.push('first_achieved');
  if (goals.filter(g => g.montoAhorrado >= g.montoObjetivo).length >= 3) unlocked.push('three_achieved');
  // 3 aportes en un mes
  const contribsByMonth = {};
  allContributions.forEach(c => {
    if (!c.fecha) return;
    const d = new Date(c.fecha);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    contribsByMonth[key] = (contribsByMonth[key] || 0) + 1;
  });
  if (Object.values(contribsByMonth).some(count => count >= 3)) unlocked.push('three_contributions_month');
  // Meta alcanzada antes de la fecha límite
  if (goals.some(g => g.montoAhorrado >= g.montoObjetivo && g.fechaLimite && new Date(g.updatedAt) < new Date(g.fechaLimite))) unlocked.push('early_achiever');
  // Aporte más grande
  if (allContributions.some(c => Number(c.monto) >= 500)) unlocked.push('big_contribution');
  // Meta con más de $1000 ahorrado
  if (goals.some(g => g.montoAhorrado >= 1000)) unlocked.push('goal_1000');
  // 6 meses seguidos ahorrando
  const monthsSet = new Set(allContributions.map(c => {
    if (!c.fecha) return null;
    const d = new Date(c.fecha);
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  }).filter(Boolean));
  if (monthsSet.size >= 6) unlocked.push('six_months_saving');
  return unlocked;
}

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showContributions, setShowContributions] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [contribGoal, setContribGoal] = useState(null);
  const [contribForm, setContribForm] = useState({ monto: '', fecha: '', nota: '' });
  const [editingContribId, setEditingContribId] = useState(null);
  const [contribLoading, setContribLoading] = useState(false);
  const [contribError, setContribError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const firstInputRef = useRef(null);
  const [achievements, setAchievements] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('achievements') || '[]');
    } catch { return []; }
  });
  const [showAchievement, setShowAchievement] = useState(null);
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    } catch { return []; }
  });
  const [pushEnabled, setPushEnabled] = useState(() => {
    try {
      return localStorage.getItem('push_enabled') === '1';
    } catch { return false; }
  });

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones push.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register('/push-sw.js');
      const { data } = await pushService.getVapidKey();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key),
      });
      await pushService.subscribe(subscription);
      localStorage.setItem('push_enabled', '1');
      setPushEnabled(true);
      alert('¡Notificaciones push activadas!');
    } catch (err) {
      alert('Error activando notificaciones push: ' + (err?.message || err));
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Actualizar solo una meta en el estado
  const updateGoalInState = (updatedGoal) => {
    setGoals((prev) => prev.map(g => g._id === updatedGoal._id ? updatedGoal : g));
  };

  // Cargar metas reales
  const loadGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await goalService.getAll();
      setGoals(res.data);
    } catch (err) {
      setError('Error cargando metas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  // Abrir modal para agregar o editar
  const openModal = (goal = null) => {
    if (goal) {
      setForm({
        nombre: goal.nombre,
        montoObjetivo: goal.montoObjetivo,
        montoAhorrado: goal.montoAhorrado,
        fechaLimite: goal.fechaLimite ? goal.fechaLimite.slice(0, 10) : '',
        notas: goal.notas || '',
      });
      setEditingId(goal._id);
    } else {
      setForm(initialForm);
      setEditingId(null);
    }
    setShowModal(true);
  };

  // Guardar meta (crear o editar)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await goalService.update(editingId, form);
        setSuccessMsg('Meta actualizada con éxito');
      } else {
        await goalService.create(form);
        setSuccessMsg('Meta agregada con éxito');
      }
      setShowModal(false);
      loadGoals();
    } catch (err) {
      setError('Error guardando meta');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar meta
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta meta? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    setError('');
    try {
      await goalService.delete(id);
      setSuccessMsg('Meta eliminada');
      loadGoals();
    } catch (err) {
      setError('Error eliminando meta');
    } finally {
      setDeletingId(null);
    }
  };

  // Mostrar historial de aportes
  const openContributions = async (goal) => {
    setContribGoal(goal);
    setShowContributions(true);
    setContribLoading(true);
    setContribError('');
    try {
      const res = await contributionService.getByGoal(goal._id);
      setContributions(res.data);
    } catch (err) {
      setContribError('Error cargando aportes');
    } finally {
      setContribLoading(false);
    }
  };

  // Validación de fecha y monto
  const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
  const isValidAmount = (amount) => !isNaN(amount) && Number(amount) > 0;

  // Agregar o editar aporte
  const handleSaveContribution = async (e) => {
    e.preventDefault();
    setContribLoading(true);
    setContribError('');
    // Validar antes de enviar
    if (!isValidAmount(contribForm.monto)) {
      setContribError('El monto debe ser un número mayor a 0');
      setContribLoading(false);
      return;
    }
    if (contribForm.fecha && !isValidDate(contribForm.fecha)) {
      setContribError('La fecha debe estar completa y en formato AAAA-MM-DD');
      setContribLoading(false);
      return;
    }
    try {
      const data = {
        ...contribForm,
        monto: Number(contribForm.monto),
        goal: contribGoal._id,
      };
      if (editingContribId) {
        await contributionService.update(editingContribId, data);
        setSuccessMsg('Aporte actualizado');
      } else {
        await contributionService.create(data);
        setSuccessMsg('Aporte agregado');
      }
      // Refrescar aportes y meta individual
      const [aportesRes, goalRes] = await Promise.all([
        contributionService.getByGoal(contribGoal._id),
        goalService.getAll()
      ]);
      setContributions(aportesRes.data);
      // Actualizar solo la meta afectada
      const updatedGoal = goalRes.data.find(g => g._id === contribGoal._id);
      if (updatedGoal) updateGoalInState(updatedGoal);
      setContribForm({ monto: '', fecha: '', nota: '' });
      setEditingContribId(null);
    } catch (err) {
      setContribError(err?.response?.data?.message || 'Error guardando aporte');
    } finally {
      setContribLoading(false);
    }
  };

  // Editar aporte
  const handleEditContribution = (contrib) => {
    setContribForm({
      monto: contrib.monto,
      fecha: contrib.fecha ? contrib.fecha.slice(0, 10) : '',
      nota: contrib.nota || '',
    });
    setEditingContribId(contrib._id);
  };

  // Eliminar aporte
  const handleDeleteContribution = async (id) => {
    if (!window.confirm('¿Eliminar este aporte? Esta acción no se puede deshacer.')) return;
    setContribLoading(true);
    setContribError('');
    try {
      await contributionService.delete(id);
      setSuccessMsg('Aporte eliminado');
      const res = await contributionService.getByGoal(contribGoal._id);
      setContributions(res.data);
      loadGoals();
      setContribForm({ monto: '', fecha: '', nota: '' });
      setEditingContribId(null);
    } catch (err) {
      setContribError('Error eliminando aporte');
    } finally {
      setContribLoading(false);
    }
  };

  // Foco automático en el primer input del modal
  useEffect(() => {
    if (showModal && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [showModal]);

  // Animación y reset de mensajes de éxito
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const getProjection = (goal, contributions) => {
    if (!goal.fechaLimite) return null;
    const today = new Date();
    const end = new Date(goal.fechaLimite);
    if (isAfter(today, end)) return null;
    const monthsLeft = Math.max(1, differenceInMonths(end, today) + 1);
    const restante = Math.max(0, goal.montoObjetivo - goal.montoAhorrado);
    const mensualNecesario = Math.ceil(restante / monthsLeft);
    // Calcular aportes de los últimos 3 meses
    const aportesRecientes = (contributions || []).filter(c => {
      const d = c.fecha ? new Date(c.fecha) : null;
      return d && d >= new Date(today.getFullYear(), today.getMonth() - 2, 1);
    });
    const totalAportado = aportesRecientes.reduce((sum, c) => sum + Number(c.monto), 0);
    const meses = Math.min(monthsLeft, 3);
    const promedioMensual = meses > 0 ? Math.round(totalAportado / meses) : 0;
    let estado = 'En línea';
    let badge = 'bg-blue-100 text-blue-700';
    if (promedioMensual > mensualNecesario) {
      estado = '¡Vas adelantado!';
      badge = 'bg-green-100 text-green-700';
    } else if (promedioMensual < mensualNecesario - 1) {
      estado = 'Atrasado';
      badge = 'bg-red-100 text-red-700';
    }
    return { mensualNecesario, promedioMensual, estado, badge, monthsLeft };
  };

  // Función para exportar metas a CSV
  function exportGoalsToCSV(goals) {
    const header = ['Nombre', 'Monto objetivo', 'Monto ahorrado', 'Fecha límite', 'Notas', 'Estado', 'Creada', 'Editada'];
    const rows = goals.map(g => [
      g.nombre,
      g.montoObjetivo,
      g.montoAhorrado,
      g.fechaLimite ? g.fechaLimite.slice(0,10) : '',
      g.notas || '',
      g.montoAhorrado >= g.montoObjetivo ? 'Alcanzada' : 'En progreso',
      g.createdAt ? g.createdAt.slice(0,10) : '',
      g.updatedAt ? g.updatedAt.slice(0,10) : ''
    ]);
    const csv = [header, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metas.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  // Función para exportar metas a PDF
  async function exportGoalsToPDF() {
    const el = document.getElementById('goals-export-area');
    if (!el) return;
    const canvas = await html2canvas(el);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save('metas.pdf');
  }
  // Exportar aportes de una meta a CSV
  function exportContributionsToCSV(goal, contributions) {
    const header = ['Meta', 'Monto', 'Fecha', 'Nota'];
    const rows = contributions.map(c => [goal.nombre, c.monto, c.fecha ? c.fecha.slice(0,10) : '', c.nota || '']);
    const csv = [header, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aportes_${goal.nombre.replace(/\s+/g,'_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  // Exportar aportes de una meta a PDF
  async function exportContributionsToPDF(goal) {
    const el = document.getElementById('contributions-export-area');
    if (!el) return;
    const canvas = await html2canvas(el);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save(`aportes_${goal.nombre.replace(/\s+/g,'_')}.pdf`);
  }

  // Cargar todos los aportes de todas las metas para logros
  const fetchAllContributions = useCallback(async () => {
    const all = [];
    for (const g of goals) {
      try {
        const res = await contributionService.getByGoal(g._id);
        all.push(...res.data);
      } catch {}
    }
    return all;
  }, [goals]);

  // Detectar logros al cargar metas o aportes
  useEffect(() => {
    if (!goals.length) return;
    fetchAllContributions().then(allContributions => {
      const unlocked = getUnlockedAchievements(goals, allContributions);
      // Solo mostrar nuevos logros
      const nuevos = unlocked.filter(l => !achievements.includes(l));
      if (nuevos.length > 0) {
        setShowAchievement(nuevos[0]);
        setAchievements(prev => {
          const updated = Array.from(new Set([...prev, ...nuevos]));
          localStorage.setItem('achievements', JSON.stringify(updated));
          return updated;
        });
      }
    });
  }, [goals, fetchAllContributions]);

  // Notificaciones visuales
  const notifications = useMemo(() => {
    const notifs = [];
    const today = new Date();
    goals.forEach(goal => {
      if (!goal.fechaLimite) return;
      const end = new Date(goal.fechaLimite);
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      // Meta próxima a vencerse (menos de 14 días)
      if (diffDays > 0 && diffDays <= 14 && goal.montoAhorrado < goal.montoObjetivo) {
        notifs.push({
          key: `close_${goal._id}`,
          type: 'warning',
          msg: `¡Tu meta "${goal.nombre}" está a ${diffDays} días de la fecha límite! ¿Quieres hacer un último aporte?`,
        });
      }
      // Meta atrasada (no cumple ahorro mensual necesario)
      if (goal.fechaLimite && goal.montoAhorrado < goal.montoObjetivo) {
        const monthsLeft = Math.max(1, differenceInMonths(end, today) + 1);
        const restante = Math.max(0, goal.montoObjetivo - goal.montoAhorrado);
        const mensualNecesario = Math.ceil(restante / monthsLeft);
        if (mensualNecesario > 0 && mensualNecesario > goal.montoAhorrado / (monthsLeft + 1)) {
          notifs.push({
            key: `late_${goal._id}`,
            type: 'danger',
            msg: `Vas atrasado en la meta "${goal.nombre}". Deberías ahorrar $${mensualNecesario}/mes para llegar a tiempo.`,
          });
        }
      }
    });
    // Sin aportes en 30 días
    goals.forEach(goal => {
      if (!goal._id) return;
      const contribs = JSON.parse(localStorage.getItem(`contribs_${goal._id}`) || '[]');
      const last = contribs.length ? new Date(contribs[contribs.length - 1].fecha) : null;
      if (last) {
        const diff = Math.ceil((today - last) / (1000 * 60 * 60 * 24));
        if (diff >= 30 && goal.montoAhorrado < goal.montoObjetivo) {
          notifs.push({
            key: `inactive_${goal._id}`,
            type: 'info',
            msg: `No has hecho aportes a "${goal.nombre}" en ${diff} días. ¡No pierdas el ritmo!`,
          });
        }
      }
    });
    return notifs.filter(n => !dismissedNotifications.includes(n.key));
  }, [goals, dismissedNotifications]);

  // Guardar aportes recientes en localStorage para notificación de inactividad
  useEffect(() => {
    goals.forEach(async goal => {
      try {
        const res = await contributionService.getByGoal(goal._id);
        localStorage.setItem(`contribs_${goal._id}`, JSON.stringify(res.data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))));
      } catch {}
    });
  }, [goals]);

  // En el useEffect que depende de notifications:
  useEffect(() => {
    notifications.forEach(async n => {
      // Email (ya implementado)
      const sentKey = `notif_email_sent_${n.key}`;
      if (!localStorage.getItem(sentKey)) {
        try {
          await goalService.notify({
            subject: 'Recordatorio de Meta',
            text: n.msg,
            html: `<p>${n.msg}</p>`
          });
          localStorage.setItem(sentKey, '1');
        } catch (err) {}
      }
      // Push
      const pushKey = `notif_push_sent_${n.key}`;
      if (pushEnabled && !localStorage.getItem(pushKey)) {
        try {
          // Obtener userId del usuario autenticado (puedes ajustar según tu AuthContext)
          const userId = JSON.parse(localStorage.getItem('user'))?._id;
          if (userId) {
            await pushService.send(userId, 'Recordatorio de Meta', n.msg);
            localStorage.setItem(pushKey, '1');
          }
        } catch (err) {}
      }
    });
  }, [notifications, pushEnabled]);

  const dismissNotification = (key) => {
    setDismissedNotifications(prev => {
      const updated = [...prev, key];
      localStorage.setItem('dismissedNotifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Notificaciones visuales (banners) */}
      {notifications.map(n => (
        <div key={n.key} className={`flex items-center gap-2 px-4 py-2 rounded shadow mb-2 animate-fade-in ${n.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : n.type === 'danger' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'}`}>
          <span>{n.type === 'warning' ? '⚠️' : n.type === 'danger' ? '⏰' : 'ℹ️'}</span>
          <span className="flex-1">{n.msg}</span>
          <button className="text-xs text-gray-500 hover:text-gray-800" onClick={() => dismissNotification(n.key)}>Descartar</button>
        </div>
      ))}
      {successMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-6 py-2 rounded shadow-lg z-modal animate-fade-in">
          {successMsg}
        </div>
      )}
      {/* Logros/insignias */}
      <div className="flex flex-wrap gap-2 mb-2">
        {LOGROS.filter(l => achievements.includes(l.key)).map(l => (
          <span key={l.key} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm animate-fade-in" title={l.desc}>
            {l.emoji} {l.label}
          </span>
        ))}
      </div>
      {/* Banner/modal de celebración */}
      {showAchievement && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setShowAchievement(null)}>
          <div className="glass-modal p-8 flex flex-col items-center gap-4 animate-modal-in">
            <div className="text-5xl">{LOGROS.find(l => l.key === showAchievement)?.emoji || '🎉'}</div>
            <div className="text-xl font-bold text-yellow-700">¡Logro desbloqueado!</div>
            <div className="text-lg font-semibold">{LOGROS.find(l => l.key === showAchievement)?.label}</div>
            <div className="text-gray-600">{LOGROS.find(l => l.key === showAchievement)?.desc}</div>
            <button className="btn-primary mt-4" onClick={() => setShowAchievement(null)}>¡Genial!</button>
          </div>
        </div>
      )}
      <PageHeader
        title="Metas de Ahorro"
        subtitle="Define, visualiza y alcanza tus metas financieras"
        actions={
          <button className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center" onClick={() => openModal()}>
            <Plus className="h-4 w-4" />
            Nueva meta
          </button>
        }
        gradientFrom="from-purple-50"
        gradientTo="to-blue-50"
        borderColor="border-purple-200"
      />

      {/* Lista de metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {goals.map(goal => (
          <div key={goal._id} className="glass-card flex flex-col gap-3 w-full max-w-full min-w-0">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                {goal.montoAhorrado >= goal.montoObjetivo ? <CheckCircle className="text-green-500 h-5 w-5 animate-bounce" title="Meta alcanzada" /> : null} {goal.nombre}
              </h2>
              {goal.montoAhorrado >= goal.montoObjetivo ? (
                <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold animate-pulse">Alcanzada</span>
              ) : goal.fechaLimite && differenceInMonths(new Date(goal.fechaLimite), new Date()) + 1 <= 2 ? (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold animate-pulse">¡Meta próxima!</span>
              ) : (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">En progreso</span>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>${goal.montoAhorrado} / ${goal.montoObjetivo}</span>
                {goal.fechaLimite && <span>Meta: {goal.fechaLimite.slice(0, 10)}</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative group">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ease-out ${goal.montoAhorrado >= goal.montoObjetivo ? 'bg-green-500' : goal.fechaLimite && differenceInMonths(new Date(goal.fechaLimite), new Date()) + 1 <= 2 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, Math.round((goal.montoAhorrado / goal.montoObjetivo) * 100))}%` }}
                  title={`Progreso: ${Math.min(100, Math.round((goal.montoAhorrado / goal.montoObjetivo) * 100))}%`}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 px-2 py-0.5 rounded shadow">{Math.min(100, Math.round((goal.montoAhorrado / goal.montoObjetivo) * 100))}% ({goal.montoObjetivo - goal.montoAhorrado > 0 ? `Faltan $${goal.montoObjetivo - goal.montoAhorrado}` : '¡Meta cumplida!'})</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">{Math.min(100, Math.round((goal.montoAhorrado / goal.montoObjetivo) * 100))}%</div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary flex items-center gap-1 group" title="Editar meta" onClick={() => openModal(goal)}>
                <Edit className="h-4 w-4 group-hover:text-primary-600" /> Editar
              </button>
              <button className="btn-danger flex items-center gap-1 group" title="Eliminar meta" onClick={() => handleDelete(goal._id)} disabled={deletingId === goal._id}>
                <Trash2 className="h-4 w-4 group-hover:text-red-700" /> {deletingId === goal._id ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button className="btn-primary flex items-center gap-1 group" title="Ver y agregar aportes" onClick={() => openContributions(goal)}>
                <Plus className="h-4 w-4 group-hover:text-white" /> Aportes
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2">Creada: {goal.createdAt ? goal.createdAt.slice(0,10) : ''}{goal.updatedAt && goal.updatedAt !== goal.createdAt ? ` • Editada: ${goal.updatedAt.slice(0,10)}` : ''}</div>
            {goal.fechaLimite && (
              <Projection goal={goal} />
            )}
            {goal.fechaLimite && differenceInMonths(new Date(goal.fechaLimite), new Date()) + 1 <= 2 && goal.montoAhorrado < goal.montoObjetivo && (
              <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs font-bold shadow animate-pulse z-10">Próxima a vencer</span>
            )}
            {notifications.some(n => n.key === `late_${goal._id}`) && (
              <span className="absolute top-2 left-2 bg-red-200 text-red-900 px-2 py-1 rounded text-xs font-bold shadow animate-pulse z-10">Atrasada</span>
            )}
            {notifications.some(n => n.key === `inactive_${goal._id}`) && (
              <span className="absolute bottom-2 right-2 bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-bold shadow animate-pulse z-10">Sin aportes recientes</span>
            )}
          </div>
        ))}
      </div>

      {/* Tabla de contribuciones (si aplica) */}
      {showContributions && (
        <div className="glass-card w-full max-w-full min-w-0 overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Meta</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Monto</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Nota</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-100">
                    <td className="px-4 py-2 text-sm text-gray-800">{contribGoal.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">${c.monto}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{c.fecha ? c.fecha.slice(0, 10) : ''}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{c.nota || ''}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      <button className="btn-secondary text-xs group-hover:bg-primary-100" title="Editar aporte" onClick={() => handleEditContribution(c)} disabled={contribLoading}>Editar</button>
                      <button className="btn-danger text-xs group-hover:bg-red-200" title="Eliminar aporte" onClick={() => handleDeleteContribution(c._id)} disabled={contribLoading}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar meta */}
      {showModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onKeyDown={e => e.key === 'Escape' && setShowModal(false)}>
          <form className="glass-modal p-6 w-full max-w-md space-y-4 relative animate-modal-in" onSubmit={handleSave}>
            <h2 className="text-xl font-bold mb-2">{editingId ? 'Editar meta' : 'Agregar meta'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                className="input mt-1"
                type="text"
                required
                ref={firstInputRef}
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Monto objetivo</label>
                <input
                  className="input mt-1"
                  type="number"
                  min="1"
                  required
                  value={form.montoObjetivo}
                  onChange={e => setForm({ ...form, montoObjetivo: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Monto ahorrado</label>
                <input
                  className="input mt-1"
                  type="number"
                  min="0"
                  required
                  value={form.montoAhorrado}
                  onChange={e => setForm({ ...form, montoAhorrado: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Fecha límite</label>
                <input
                  className="input mt-1"
                  type="date"
                  value={form.fechaLimite}
                  onChange={e => setForm({ ...form, fechaLimite: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <input
                  className="input mt-1"
                  type="text"
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Agregar meta')}
              </button>
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </form>
        </div>
      )}
      {/* Modal de historial de aportes */}
      {showContributions && contribGoal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={e => { if (e.target === e.currentTarget) { setShowContributions(false); setContribForm({ monto: '', fecha: '', nota: '' }); setEditingContribId(null); } }} onKeyDown={e => e.key === 'Escape' && setShowContributions(false)}>
          <div className="glass-modal p-6 w-full max-w-lg space-y-4 relative animate-modal-in">
            <h2 className="text-xl font-bold mb-2">Aportes a "{contribGoal.nombre}"</h2>
            <div className="flex justify-end gap-2 mb-2">
              <button className="btn-secondary text-xs" onClick={() => exportContributionsToCSV(contribGoal, contributions)} title="Exportar aportes a CSV">Exportar CSV</button>
              <button className="btn-secondary text-xs" onClick={() => exportContributionsToPDF(contribGoal)} title="Exportar aportes a PDF">Exportar PDF</button>
            </div>
            <div id="contributions-export-area">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total aportado: <span className="font-bold text-primary-700">${contribGoal.montoAhorrado}</span> / ${contribGoal.montoObjetivo}</span>
                <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1" onClick={() => { setShowContributions(false); setContribForm({ monto: '', fecha: '', nota: '' }); setEditingContribId(null); }} title="Cerrar modal">
                  <span className="text-lg">×</span> <span className="text-xs">Cerrar</span>
                </button>
              </div>
              {contribError && <div className="text-red-600">{contribError}</div>}
              {contribLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  <form className="space-y-2" onSubmit={handleSaveContribution}>
                    <div className="flex gap-2">
                      <input
                        className="input"
                        type="number"
                        min="1"
                        required
                        placeholder="Monto"
                        value={contribForm.monto}
                        onChange={e => setContribForm({ ...contribForm, monto: e.target.value })}
                        autoFocus
                      />
                      <input
                        className="input"
                        type="date"
                        value={contribForm.fecha}
                        onChange={e => setContribForm({ ...contribForm, fecha: e.target.value })}
                      />
                      <input
                        className="input"
                        type="text"
                        placeholder="Ej: Primer abono, regalo, etc."
                        value={contribForm.nota}
                        onChange={e => setContribForm({ ...contribForm, nota: e.target.value })}
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={contribLoading || !isValidAmount(contribForm.monto) || (contribForm.fecha && !isValidDate(contribForm.fecha))}
                        title={editingContribId ? 'Guardar cambios' : 'Agregar aporte'}
                      >
                        {editingContribId ? 'Guardar' : 'Agregar'}
                      </button>
                    </div>
                  </form>
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Historial de aportes</h3>
                    {contributions.length === 0 ? (
                      <div className="text-gray-500 text-sm">No hay aportes aún.<br/>¡Empieza a ahorrar para tu meta!</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {contributions.map((c) => (
                          <li key={c._id} className="flex items-center justify-between py-2 group transition-colors">
                            <div>
                              <div className="font-medium text-gray-800">${c.monto}</div>
                              <div className="text-xs text-gray-500">{c.fecha ? c.fecha.slice(0, 10) : ''} {c.nota && `- ${c.nota}`}</div>
                            </div>
                            <div className="flex gap-2">
                              <button className="btn-secondary text-xs group-hover:bg-primary-100" title="Editar aporte" onClick={() => handleEditContribution(c)} disabled={contribLoading}>Editar</button>
                              <button className="btn-danger text-xs group-hover:bg-red-200" title="Eliminar aporte" onClick={() => handleDeleteContribution(c._id)} disabled={contribLoading}>Eliminar</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Projection({ goal }) {
  const [contributions, setContributions] = useState([]);
  useEffect(() => {
    let mounted = true;
    contributionService.getByGoal(goal._id).then(res => {
      if (mounted) setContributions(res.data);
    });
    return () => { mounted = false; };
  }, [goal._id]);
  const proj = getProjection(goal, contributions);
  if (!proj) return null;

  // Mini-gráfica de barras: aportes últimos 6 meses
  const today = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      total: 0,
    });
  }
  contributions.forEach(c => {
    if (!c.fecha) return;
    const d = new Date(c.fecha);
    const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (idx !== -1) months[idx].total += Number(c.monto);
  });

  return (
    <div className="mt-2 text-xs">
      <div className="flex items-center gap-2">
        <span>Debes ahorrar <span className="font-bold text-primary-700">${proj.mensualNecesario}/mes</span> para llegar a tiempo.</span>
        <span className={`px-2 py-0.5 rounded font-semibold ${proj.badge}`}>{proj.estado}</span>
      </div>
      <div className="text-gray-500 mt-1">Promedio últimos meses: <span className="font-semibold">${proj.promedioMensual}/mes</span> • Meses restantes: {proj.monthsLeft}</div>
      <div className="mt-2">
        <span className="block text-gray-400 mb-1">Aportes últimos 6 meses</span>
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={months} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Tooltip formatter={v => `$${v}`} />
            <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Goals; 