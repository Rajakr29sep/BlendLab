export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  console.error('[api]', error);
  res.status(500).json({ error: 'Unexpected API error.', detail: process.env.NODE_ENV === 'development' ? error.message : undefined });
}
