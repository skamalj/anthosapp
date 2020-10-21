/* eslint-disable max-len */
const config = require('config');
const {spawn} = require('child_process');
const fs = require('fs');
const handlebars = require('handlebars');
const yaml = require('yaml');
const {compileTemplateToRepo} = require('./anthosFSController');

const OPERATOR_PATH = config.get('OPERATOR_PATH');
const KUBE_CONFIG_BASEPATH = config.get('KUBE_CONFIG_BASEPATH');
const GIT_CONFIG_BASEPATH = config.get('GIT_CONFIG_BASEPATH');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');

// This creates git secret, details of which it gets from save gitconfig file,
// then deploys config operator to the cluster, see the use of --kubeconfig flag to
// point to right cluster in the command
const deployOperator = function(req, res) {
  const deployOperator = `kubectl apply -f ${OPERATOR_PATH} \
    --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}`;
  const gitsecret = `kubectl create secret generic git-creds --namespace=config-management-system \
    --from-file=ssh=${GIT_CONFIG_BASEPATH}${req.body.repoName} --dry-run -o yaml | \
    kubectl apply --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName} -f -`;

  const repo = fs.readFileSync(`${GIT_CONFIG_BASEPATH}gitrepos.config`, 'utf-8');
  const repoFullName = (JSON.parse(repo)).repos.filter((r) => r.repoName === req.body.repoName);

  const kubetemplate = fs.readFileSync(`${TEMPLATE_PATH}config-management.tpl`, 'utf8');
  const template = handlebars.compile(kubetemplate);
  const result = template({
    REPO_NAME: repoFullName[0].repo,
    CLUSTER_NAME: req.body.clusterName,
  });

  fs.writeFileSync(`${KUBE_CONFIG_BASEPATH}${req.body.clusterName}-config-management.yaml`, result);
  const applyOperatorConfig = `kubectl apply -f ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}-config-management.yaml \
  --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}`;

  runKubectl(deployOperator)
      .then(() => runKubectl(gitsecret))
      .then(()=> runKubectl(applyOperatorConfig))
      .then(() => {
        const msg = `Operator deployed successfully for cluster ${req.body.clustername}`;
        res.status(200).send(msg);
      })
      .catch((err) => {
        const msg = `Operator for cluster ${req.body.clustername} could not be deploued: ${err}`;
        res.status(500).send(msg);
      });
};

// Execute kubectl command
const runKubectl = function(cmd) {
  return new Promise(async (resolve, reject) => {
    const kubectlProcess = spawn(cmd, {detached: true, shell: true});

    kubectlProcess.stdout.on('data', (data) => {
      console.log(`kubectl stdout: ${data}`);
    });
    kubectlProcess.stderr.on('data', (data) => {
      console.error(`kubectl stderr: ${data}`);
    });
    kubectlProcess.on('close', (code) => {
      console.log(`Kubectl command: ${cmd} exited with code ${code}`);
      if (code != 0) {
        reject(new Error(`Failed to execute kubectl command: ${cmd}`));
      } else {
        resolve();
      }
    });
  });
};

// Return list of registered clusters
const getClusters = async function(req, res) {
  let clusters;
  try {
    const dirents = fs.readdirSync(KUBE_CONFIG_BASEPATH, {withFileTypes: true});
    clusters = await dirents.filter((dir) => dir.isFile).map((file) => {
      const yamlcontent = fs.readFileSync(`${KUBE_CONFIG_BASEPATH}${file.name}`, 'utf8');
      const doc = yaml.parseDocument(yamlcontent);
      if (JSON.parse(JSON.stringify(doc.contents)).clusters) {
        const cluster = JSON.parse(JSON.stringify(doc.contents)).clusters[0];
        return {endpoint: cluster.cluster.server, name: cluster.name};
      } else {
        return null;
      }
    });
    console.log(`Cluster list: ${clusters}`);
    return res.status(200).send(clusters);
  } catch (err) {
    console.log(`Cannot create cluster list ${err}`);
    return res.status(500).send('Cannot create cluster list');
  }
};

// Create manifest to attach labels to cluster
const labelCluster = function(req, res) {
  const values = {CLUSTER_NAME: JSON.parse(req.body.clustername), LABELS: JSON.parse(req.body.labelrows)};
  const template = `${TEMPLATE_PATH}cluster-labels.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/clusterregistry`;
  repolocation = `${repolocation}/${JSON.parse(req.body.clustername)}-labels.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Cluster labels saved: ${result}`);
        return res.status(200).send(`Cluster labels saved: ${result}`);
      })
      .catch((err) => {
        console.log(`Cluster labels not saved: ${err}`);
        return res.status(500).send(`Cluster labels not saved for cluster ${req.body.clustername}`);
      });
};

// Create manifest to create clusterrole
const createClusterRole = function(req, res) {
  const values = {ROLE_NAME: JSON.parse(req.body.clusterrole), RULES: JSON.parse(req.body.rules)};
  const template = `${TEMPLATE_PATH}clusterrole.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/cluster`;
  repolocation = `${repolocation}/${JSON.parse(req.body.clusterrole)}.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Cluster role saved: ${result}`);
        return res.status(200).send(`Cluster role saved: ${result}`);
      })
      .catch((err) => {
        console.log(`Clusterrole not saved: ${err}`);
        return res.status(500).send(`Clusterrole not saved for role ${req.body.clusterrole}`);
      });
};


module.exports = {
  deployOperator: deployOperator,
  getClusters: getClusters,
  labelCluster: labelCluster,
  createClusterRole: createClusterRole,
};
