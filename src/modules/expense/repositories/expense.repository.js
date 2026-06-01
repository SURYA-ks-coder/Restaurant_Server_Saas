const BaseRepository = require("../../../repositories/BaseRepository");
const Expense = require("../models/Expense.model");

class ExpenseRepository extends BaseRepository {
  constructor() {
    super(Expense);
  }
}

module.exports = new ExpenseRepository();
