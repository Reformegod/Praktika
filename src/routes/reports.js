const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try {
    const totalProducts = await pool.query('SELECT COUNT(*)::int AS count FROM products');
    const lowStock = await pool.query('SELECT COUNT(*)::int AS count FROM products WHERE quantity <= min_quantity');
    const expired = await pool.query("SELECT COUNT(*)::int AS count FROM products WHERE expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE");
    const reserved = await pool.query("SELECT COALESCE(SUM(quantity),0)::int AS count FROM reservations WHERE status='active'");

    res.json({
      totalProducts: totalProducts.rows[0].count,
      lowStock: lowStock.rows[0].count,
      expired: expired.rows[0].count,
      reserved: reserved.rows[0].count,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
