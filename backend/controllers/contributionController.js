const Contribution = require('../models/Contribution');
const Goal = require('../models/Goal');

// Helper para recalcular el monto ahorrado de la meta
async function updateGoalAmount(goalId) {
  const total = await Contribution.aggregate([
    { $match: { goal: goalId } },
    { $group: { _id: null, sum: { $sum: '$monto' } } }
  ]);
  const montoAhorrado = total[0]?.sum || 0;
  await Goal.findByIdAndUpdate(goalId, { montoAhorrado });
}

// Listar aportes de una meta
exports.getContributionsByGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const contributions = await Contribution.find({ goal: goalId, user: req.user._id }).sort({ fecha: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener aportes', error: err.message });
  }
};

// Crear aporte
exports.createContribution = async (req, res) => {
  try {
    const { goal, monto, fecha, nota } = req.body;
    const contribution = new Contribution({
      goal,
      user: req.user._id,
      monto,
      fecha: fecha || Date.now(),
      nota
    });
    await contribution.save();
    await updateGoalAmount(goal);
    res.status(201).json(contribution);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear aporte', error: err.message });
  }
};

// Editar aporte
exports.updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contribution.findOneAndUpdate(
      { _id: id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contribution) return res.status(404).json({ message: 'Aporte no encontrado' });
    await updateGoalAmount(contribution.goal);
    res.json(contribution);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar aporte', error: err.message });
  }
};

// Eliminar aporte
exports.deleteContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contribution.findOneAndDelete({ _id: id, user: req.user._id });
    if (!contribution) return res.status(404).json({ message: 'Aporte no encontrado' });
    await updateGoalAmount(contribution.goal);
    res.json({ message: 'Aporte eliminado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar aporte', error: err.message });
  }
}; 