// Express 4 does not forward rejected promises from async route handlers to the
// error handler; they become unhandled rejections that crash the process.
// Wrap every route handler of a router so errors reach next().
module.exports = function wrapAsyncRoutes(router) {
  for (const layer of router.stack) {
    if (!layer.route) continue;
    for (const routeLayer of layer.route.stack) {
      const handle = routeLayer.handle;
      routeLayer.handle = (req, res, next) => {
        try {
          const result = handle(req, res, next);
          if (result && typeof result.catch === 'function') result.catch(next);
        } catch (error) {
          next(error);
        }
      };
    }
  }
  return router;
};
