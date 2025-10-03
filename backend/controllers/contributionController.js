const { Contribution, Goal } = require('../models');

// Helper para recalcular el monto ahorrado de la meta
async function updateGoalAmount(goalId) {
  const result = await Contribution.findAll({
    where: { goalId: goalId },
    attributes: [
      [Contribution.sequelize.fn('SUM', Contribution.sequelize.col('amount')), 'sum']
    ],
    raw: true
  });

  const savedAmount = parseFloat(result[0]?.sum || 0);

  await Goal.update(
    { savedAmount },
    { where: { id: goalId } }
  );
}

// Listar aportes de una meta
exports.getContributionsByGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const contributions = await Contribution.findAll({
      where: { goalId: goalId, userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener aportes', error: err.message });
  }
};

// Crear aporte
exports.createContribution = async (req, res) => {
  try {
    const { goalId, amount, date, note } = req.body;
    const contribution = await Contribution.create({
      goalId,
      userId: req.user.id,
      amount,
      date: date || new Date(),
      note
    });
    await updateGoalAmount(goalId);
    res.status(201).json(contribution);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear aporte', error: err.message });
  }
};

// Editar aporte
exports.updateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contribution.findOne({
      where: { id: id, userId: req.user.id }
    });

    if (!contribution) {
      return res.status(404).json({ message: 'Aporte no encontrado' });
    }

    // Actualizar campos
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        contribution[key] = req.body[key];
      }
    });

    await contribution.save();
    await updateGoalAmount(contribution.goalId);
    res.json(contribution);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar aporte', error: err.message });
  }
};

// Eliminar aporte
exports.deleteContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await Contribution.findOne({
      where: { id: id, userId: req.user.id }
    });

    if (!contribution) {
      return res.status(404).json({ message: 'Aporte no encontrado' });
    }

    const goalId = contribution.goalId;
    await contribution.destroy();
    await updateGoalAmount(goalId);
    res.json({ message: 'Aporte eliminado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar aporte', error: err.message });
  }
};
