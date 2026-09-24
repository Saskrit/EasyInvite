// Vercel Serverless Dynamic Catch-All Route for /api/*
const apiIndexHandler = require('./index');

module.exports = async (req, res) => {
  return apiIndexHandler(req, res);
};
