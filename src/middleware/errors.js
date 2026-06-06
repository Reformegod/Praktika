function notFound(req, res, next) {
  res.status(404).json({ message: 'Маршрут не найден' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Ошибка сервера',
  });
}

module.exports = { notFound, errorHandler };
