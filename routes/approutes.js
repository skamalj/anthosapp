// Defines routes for the application linked to controllers/callback functions

const anthosfsctrl = require('../controllers/anthosFSController.js');
const clusterconfigctrl = require('../controllers/clusterConfigController.js');
const repotreectrl = require('../controllers/repoTreeController.js');
const namespacectrl = require('../controllers/namespaceController.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('anthosui');
  });


  app.post('/savekubeconfig', anthosfsctrl.saveAnthosConfig);
  app.post('/saveGitRepo', anthosfsctrl.saveGitRepo);
  app.post('/getrepolist', anthosfsctrl.listGitRepos);
  app.post('/deleteFile', anthosfsctrl.deleteFile);
  app.post('/showFileContent', anthosfsctrl.showFileContent);

  app.post('/labelCluster', clusterconfigctrl.labelCluster);
  app.post('/deployOperator', clusterconfigctrl.deployOperator);
  app.post('/getClusterList', clusterconfigctrl.getClusters);
  app.post('/createClusterRole', clusterconfigctrl.createClusterRole);

  app.post('/getRepoTree', repotreectrl.repoTree);
  app.post('/createNamespace', namespacectrl.createNamespace);


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
