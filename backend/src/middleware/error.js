export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Resource not found.' });
}

export function errorHandler(err, req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large.' });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ success: false, message: `That ${field} is already in use.` });
  }
  if (err?.name === 'ValidationError') {
    const message = Object.values(err.errors || {}).map((e) => e.message).join(' ') || 'Invalid data.';
    return res.status(400).json({ success: false, message });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier.' });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 ? 'Something went wrong. Please try again.' : err.message;
  res.status(status).json({ success: false, message });
}
