module.exports = function handler(req, res) {
  res.status(200).json({
    body: req.body,
    headers: req.headers,
    method: req.method
  });
};
