const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { product_id, new_quantity, comment } = req.body;
    const newQty = Number(new_quantity);

    if (!product_id || newQty < 0) {
      return res.status(400).json({ message: 'Укажите товар и корректное количество' });
    }

    await client.query('BEGIN');
    const productResult = await client.query('SELECT quantity FROM products WHERE id=$1 FOR UPDATE', [product_id]);
    const product = productResult.rows[0];
    if (!product) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Товар не найден' });
    }

    await client.query('UPDATE products SET quantity=$1 WHERE id=$2', [newQty, product_id]);
    const result = await client.query(
      `INSERT INTO inventory_checks (product_id, old_quantity, new_quantity, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [product_id, product.quantity, newQty, comment || null]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.sku, p.name
      FROM inventory_checks i
      JOIN products p ON p.id = i.product_id
      ORDER BY i.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
