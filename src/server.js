const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productsRouter = require('./routes/products');
const movementsRouter = require('./routes/movements');
const reservationsRouter = require('./routes/reservations');
const inventoryRouter = require('./routes/inventory');
const reportsRouter = require('./routes/reports');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/products', productsRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reports', reportsRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
