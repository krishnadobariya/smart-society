const Expense = require('../models/Expense');
const Maintenance = require('../models/Maintenance');
const Income = require('../models/Income');

exports.addExpense = async (req, res) => {
  const { title, amount, category, description } = req.body;
  try {
    const expense = await Expense.create({ title, amount, category, description });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFinancialSummary = async (req, res) => {
  let { startDate, endDate } = req.query;
  try {
    let matchCondition = { status: 'paid' };
    let expenseMatchCondition = {};
    let incomeMatchCondition = {};

    // Default to current month if no dates provided
    if (!startDate || !endDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }

    matchCondition.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    expenseMatchCondition.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    incomeMatchCondition.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const totalMaintenanceResult = await Maintenance.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalManualIncomeResult = await Income.aggregate([
      { $match: incomeMatchCondition },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalExpenseResult = await Expense.aggregate([
      { $match: expenseMatchCondition },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Breakdown by Category (Manual Income)
    const manualIncomeBreakdown = await Income.aggregate([
      { $match: incomeMatchCondition },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    // Breakdown by Category (Expenses)
    const expenseBreakdown = await Expense.aggregate([
      { $match: expenseMatchCondition },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    // Breakdown by Month (Maintenance Income)
    const maintenanceBreakdown = await Maintenance.aggregate([
      { $match: matchCondition },
      { $group: { _id: '$month', total: { $sum: '$amount' } } },
      { $sort: { '_id': -1 } }
    ]);

    // Monthly data for charts
    const chartStartDate = new Date(startDate);
    const chartEndDate = new Date(endDate);

    const monthlyMaintenance = await Maintenance.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: chartStartDate, $lte: chartEndDate } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $project: { _id: 0, month: '$_id.month', year: '$_id.year', total: 1 } }
    ]);

    const monthlyManualIncome = await Income.aggregate([
      { $match: { date: { $gte: chartStartDate, $lte: chartEndDate } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      { $project: { _id: 0, month: '$_id.month', year: '$_id.year', total: 1 } }
    ]);

    const monthlyExpense = await Expense.aggregate([
      { $match: { createdAt: { $gte: chartStartDate, $lte: chartEndDate } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $project: { _id: 0, month: '$_id.month', year: '$_id.year', total: 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let chartData = [];
    let current = new Date(chartStartDate);
    while (current <= chartEndDate) {
      const m = current.getMonth() + 1;
      const y = current.getFullYear();
      const maint = monthlyMaintenance.find(item => item.month === m && item.year === y)?.total || 0;
      const manual = monthlyManualIncome.find(item => item.month === m && item.year === y)?.total || 0;
      const exp = monthlyExpense.find(item => item.month === m && item.year === y)?.total || 0;
      chartData.push({
        name: `${monthNames[m-1]} ${y}`,
        income: maint + manual,
        expense: exp
      });
      current.setMonth(current.getMonth() + 1);
      if (chartData.length > 24) break; 
    }

    const totalMaint = totalMaintenanceResult[0] ? totalMaintenanceResult[0].total : 0;
    const totalManual = totalManualIncomeResult[0] ? totalManualIncomeResult[0].total : 0;
    const totalIncome = totalMaint + totalManual;
    const totalExpense = totalExpenseResult[0] ? totalExpenseResult[0].total : 0;

    res.json({
      totalIncome,
      totalMaint,
      totalManual,
      totalExpense,
      balance: totalIncome - totalExpense,
      chartData,
      expenseBreakdown,
      maintenanceBreakdown,
      manualIncomeBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllExpenses = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportFinancialReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let incomeQuery = { status: 'paid' };
    let expenseQuery = {};
    let otherIncomeQuery = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      incomeQuery.createdAt = { $gte: start, $lte: end };
      expenseQuery.createdAt = { $gte: start, $lte: end };
      otherIncomeQuery.date = { $gte: start, $lte: end };
    }

    const maintenance = await Maintenance.find(incomeQuery).populate({
      path: 'flatId',
      populate: { path: 'owner', select: 'name' }
    });
    const otherIncome = await Income.find(otherIncomeQuery);
    const expenses = await Expense.find(expenseQuery);

    let csv = 'Type,Title/Resident,Category,Amount,Date,Description\n';

    // Add Maintenance
    maintenance.forEach(m => {
      const resident = m.flatId?.owner?.name || 'N/A';
      const flat = m.flatId?.flatNumber || '';
      csv += `Income (Maint),"${resident} (Flat ${flat})","Maintenance",${m.amount},"${m.paymentDate?.toLocaleDateString() || m.createdAt.toLocaleDateString()}","Month: ${m.month}"\n`;
    });

    // Add Other Income
    otherIncome.forEach(inc => {
      csv += `Income (Other),"${inc.title}","${inc.category}",${inc.amount},"${inc.date.toLocaleDateString()}","${inc.description || ''}"\n`;
    });

    // Add Expenses
    expenses.forEach(exp => {
      csv += `Expense,"${exp.title}","${exp.category}",${exp.amount},"${exp.createdAt.toLocaleDateString()}","${exp.description || ''}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`financial_report_${startDate || 'all'}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
