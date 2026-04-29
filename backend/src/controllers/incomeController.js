const Income = require('../models/Income');

exports.addIncome = async (req, res) => {
  const { title, amount, category, date, description } = req.body;
  try {
    const income = await Income.create({ title, amount, category, date, description });
    
    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `Other Income added: ${title}`,
      income
    });

    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllIncome = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const income = await Income.find(query).sort({ date: -1 });
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `Income updated: ${income.title}`
    });

    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    
    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `Income deleted`
    });

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
