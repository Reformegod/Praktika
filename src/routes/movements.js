const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.sku, p.name
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      ORDER BY m.id DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { product_id, operation_type, quantity, from_cell, to_cell, comment } = req.body;
    const qty = Number(quantity);

    if (!product_id || !operation_type || !qty || qty <= 0) {
      return res.status(400).json({ message: 'Укажите товар, тип операции и количество больше 0' });
    }

    await client.query('BEGIN');

    const productResult = await client.query('SELECT * FROM products WHERE id=$1 FOR UPDATE', [product_id]);
    const product = productResult.rows[0];
    if (!product) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Товар не найден' });
    }

    let newQuantity = product.quantity;
    let newCell = product.cell;

    if (operation_type === 'receipt') {
      newQuantity += qty;
    } else if (operation_type === 'writeoff') {
      if (product.quantity < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Недостаточно товара. Отрицательные остатки запрещены' });
      }
      newQuantity -= qty;
    } else if (operation_type === 'move') {
      if (!to_cell) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Для перемещения укажите новую ячейку' });
      }
      newCell = to_cell;
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Неизвестный тип операции' });
    }

    await client.query('UPDATE products SET quantity=$1, cell=$2 WHERE id=$3', [newQuantity, newCell, product_id]);

    const movementResult = await client.query(
      `INSERT INTO stock_movements (product_id, operation_type, quantity, from_cell, to_cell, comment)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [product_id, operation_type, qty, from_cell || product.cell, to_cell || newCell, comment || null]
    );

    await client.query('COMMIT');
    res.status(201).json(movementResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
