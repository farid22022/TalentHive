/** Consistent success envelope. */
export function ok(res, data = {}, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function created(res, data = {}, message = 'Created') {
  return ok(res, data, message, 201);
}

/** Paginated envelope: { items, pagination }. */
export function paginated(res, items, { page, limit, total }, message = 'OK') {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
}
