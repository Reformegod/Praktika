const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search = '', lowStock = 'false' } = req.query;
    const values = [`%${search}%`];
    let sql = `
      SELECT * FROM products
      WHERE (sku ILIKE $1 OR name ILIKE $1 OR category ILIKE $1 OR cell ILIKE $1 OR batch ILIKE $1)
    `;

    if (lowStock === 'true') {
      sql += ' AND quantity <= min_quantity';
    }

    sql += ' ORDER BY id DESC';
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { sku, name, category, unit, quantity, cell, batch, expiration_date, min_quantity, status } = req.body;

    if (!sku || !name || !category || !unit || !cell || !batch) {
      return res.status(400).json({ message: 'Заполните обязательные поля товара' });
    }

    const result = await pool.query(
      `INSERT INTO products
       (sku, name, category, unit, quantity, cell, batch, expiration_date, min_quantity, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [sku, name, category, unit, Number(quantity || 0), cell, batch, expiration_date || null, Number(min_quantity || 0), status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sku, name, category, unit, quantity, cell, batch, expiration_date, min_quantity, status } = req.body;

    const result = await pool.query(
      `UPDATE products SET
        sku=$1, name=$2, category=$3, unit=$4, quantity=$5, cell=$6, batch=$7,
        expiration_date=$8, min_quantity=$9, status=$10
       WHERE id=$11 RETURNING *`,
      [sku, name, category, unit, Number(quantity), cell, batch, expiration_date || null, Number(min_quantity || 0), status || 'active', id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Товар не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Товар не найден' });
    res.json({ message: 'Товар удален' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
