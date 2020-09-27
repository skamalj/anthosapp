// Defines routes for the application linked to controllers/callback functions

const anthosuictrl = require('../controllers/anthosUIController.js');
const clusterconfigctrl = require('../controllers/clusterConfigController.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('anthosui');
  });


  app.post('/savekubeconfig', anthosuictrl.saveAnthosConfig);
  app.post('/saveGitRepo', anthosuictrl.saveGitRepo);
  app.post('/deployOperator', clusterconfigctrl.deployOperator);

  // 404
  app.use(function(req, res, next) {
    res.status(404);
    res.render('404');
  });
  // 500
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
  });
};
