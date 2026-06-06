const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT r.*, p.sku, p.name
      FROM reservations r
      JOIN products p ON p.id = r.product_id
      ORDER BY r.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, quantity, customer } = req.body;
    const qty = Number(quantity);

    const productResult = await pool.query('SELECT quantity FROM products WHERE id=$1', [product_id]);
    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    if (product.quantity < qty) return res.status(400).json({ message: 'Нельзя зарезервировать больше текущего остатка' });

    const result = await pool.query(
      `INSERT INTO reservations (product_id, quantity, customer)
       VALUES ($1,$2,$3) RETURNING *`,
      [product_id, qty, customer]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/close', async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE reservations SET status='closed' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Резерв не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
