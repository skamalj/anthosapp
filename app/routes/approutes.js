/* eslint-disable max-len */
// Defines routes for the application linked to controllers/callback functions

const anthosfsctrl = require('../controllers/anthosFSController.js');
const clusterconfigctrl = require('../controllers/clusterConfigController.js');
const repotreectrl = require('../controllers/repoTreeController.js');
const namespacectrl = require('../controllers/namespaceController.js');
const opapolicyctrl = require('../controllers/opaPolicyController.js');
const securitytoolsctrl = require('../controllers/toolsController.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('anthosui');
  });


  app.post('/saveAnthosConfig', anthosfsctrl.saveAnthosConfig);
  app.post('/saveGitRepo', anthosfsctrl.saveGitRepo);
  app.post('/getrepolist', anthosfsctrl.listGitRepos);
  app.post('/deleteFile', anthosfsctrl.deleteFile);
  app.post('/showFileContent', anthosfsctrl.showFileContent);
  app.post('/deleteDir', anthosfsctrl.deleteDir);
  app.post('/syncRepo', anthosfsctrl.execSyncRepo);

  app.post('/labelCluster', clusterconfigctrl.labelCluster);
  app.post('/createClusterSelector', clusterconfigctrl.createClusterSelector);
  app.post('/deployOperator', clusterconfigctrl.deployOperator);
  app.post('/getClusterList', clusterconfigctrl.getClusters);
  app.post('/createClusterRole', clusterconfigctrl.createClusterRole);
  app.post('/uploadClusterObjectYaml', clusterconfigctrl.uploadClusterObjectYaml);
  app.post('/runNomos', clusterconfigctrl.runNomos);
  app.post('/getClusterLabels', clusterconfigctrl.getClusterLabels);

  app.post('/getRepoTree', repotreectrl.repoTree);
  app.post('/createNamespace', namespacectrl.createNamespace);
  app.post('/createNamespaceSelector', namespacectrl.createNamespaceSelector);
  app.post('/listEmptyNS', namespacectrl.listEmptyNS);
  app.post('/uploadObjectYaml', namespacectrl.uploadObjectYaml);
  app.post('/createNetworkPolicy', namespacectrl.createNetworkPolicy);
  app.post('/createDefaultNetworkPolicy', namespacectrl.createDefaultNetworkPolicy);
  app.post('/createResourceQuotas', namespacectrl.createResourceQuotas);
  app.post('/createDeployment', namespacectrl.createDeployment);

  app.post('/createGeneralOPAPolicies', opapolicyctrl.createGeneralOPAPolicies);

  app.post('/setupSysdig', securitytoolsctrl.setupSysdig);

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
