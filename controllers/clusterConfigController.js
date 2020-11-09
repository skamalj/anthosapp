/* eslint-disable max-len */
const config = require('config');
const {spawn} = require('child_process');
const fs = require('fs');
const handlebars = require('handlebars');
const yaml = require('yaml');
const {compileTemplateToRepo, saveFile} = require('./anthosFSController');

const OPERATOR_PATH = config.get('OPERATOR_PATH');
const KUBE_CONFIG_BASEPATH = config.get('KUBE_CONFIG_BASEPATH');
const GIT_CONFIG_BASEPATH = config.get('GIT_CONFIG_BASEPATH');
const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');

// This creates git secret, details of which it gets from save gitconfig file,
// then deploys config operator to the cluster, see the use of --kubeconfig flag to
// point to right cluster in the command
const deployOperator = async function(req, res) {
  const deployOperator = `kubectl apply -f ${OPERATOR_PATH} \
    --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}`;

  // Create kubectl command for creating git secret
  const gitsecret = `kubectl create secret generic git-creds --namespace=config-management-system \
    --from-file=ssh=${GIT_CONFIG_BASEPATH}${req.body.repoName} --dry-run -o yaml | \
    kubectl apply --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName} -f -`;

  // Cluster config management requires git secret, this is read from  saved git configuration
  const repo = fs.readFileSync(`${GIT_CONFIG_BASEPATH}gitrepos.config`, 'utf-8');
  const repoFullName = (JSON.parse(repo)).repos.filter((r) => r.repoName === req.body.repoName);

  // Required details are passed into template to create config management yaml for cluster
  const kubetemplate = fs.readFileSync(`${TEMPLATE_PATH}config-management.tpl`, 'utf8');
  const template = handlebars.compile(kubetemplate);
  const result = template({
    REPO_NAME: repoFullName[0].repo,
    CLUSTER_NAME: req.body.clusterName,
  });

  // This creates kubectl command for applying the created config management yaml
  fs.writeFileSync(`${KUBE_CONFIG_BASEPATH}${req.body.clusterName}-config-management.yaml`, result);
  const applyOperatorConfig = `kubectl apply -f ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}-config-management.yaml \
  --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}`;

  // Now execute all the generated commands
  runKubectl(deployOperator)
      .then(() => runKubectl(gitsecret))
      .then(()=> runKubectl(applyOperatorConfig))
      .then(() => {
        const msg = `Operator deployed successfully for cluster ${req.body.clusterName}`;
        res.status(200).send(msg);
      })
      .catch((err) => {
        const msg = `Operator for cluster ${req.body.clusterName} could not be deploued`;
        console.log(`msg: ${err}`);
        res.status(500).send(msg);
      });
};

// Execute kubectl command
const runKubectl = async function(cmd) {
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
    return res.status(200).send(clusters);
  } catch (err) {
    console.log(`Cannot create cluster list ${err}`);
    return res.status(500).send('Cannot create cluster list');
  }
};

// Create manifest to attach labels to cluster
const labelCluster = async function(req, res) {
  const values = {CLUSTER_NAME: JSON.parse(req.body.clustername), LABELS: JSON.parse(req.body.labelrows)};
  const template = `${TEMPLATE_PATH}cluster-labels.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/clusterregistry`;
  repolocation = `${repolocation}/${JSON.parse(req.body.clustername)}-labels.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Cluster labels saved: ${result}`);
        return res.status(200).send(`Labels saved for cluster ${JSON.parse(req.body.clustername)}`);
      })
      .catch((err) => {
        console.log(`Cluster labels not saved: ${err}`);
        return res.status(500).send(`Cluster labels not saved for cluster ${req.body.clustername}`);
      });
};

// Create cluster selector and save it in clusterregistry
const createClusterSelector = async function(req, res) {
  // Set values for templates
  const values = {SELECTOR_NAME: JSON.parse(req.body.selectorname),
    KIND: 'ClusterSelector',
    APIVERSION: 'configmanagement.gke.io/v1',
    LABELS: JSON.parse(req.body.labelrows)};

  // Get the template, this temlate is used by both clusterselector as well as namespaceselector
  const template = `${TEMPLATE_PATH}anthos-selector.tpl`;

  // Set filelocation and name for selector
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/clusterregistry`;
  repolocation = `${repolocation}/${JSON.parse(req.body.selectorname)}-clusterselector.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`ClusterSelector saved: ${result}`);
        return res.status(200).send(`ClusterSelector saved: ${JSON.parse(req.body.selectorname)}`);
      })
      .catch((err) => {
        console.log(`ClusterSelector ${JSON.parse(req.body.selectorname)} not saved: ${err}`);
        return res.status(500).send(`ClusterSelector  ${JSON.parse(req.body.selectorname)} not saved`);
      });
};

// Create manifest for clusterrole
const createClusterRole = async function(req, res) {
  const values = {ROLE_NAME: JSON.parse(req.body.clusterrole), CLUSTER_SELECTOR: JSON.parse(req.body.clusterselector),
    RULES: JSON.parse(req.body.rules)};
  const template = `${TEMPLATE_PATH}clusterrole.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/cluster`;
  repolocation = `${repolocation}/${JSON.parse(req.body.clusterrole)}.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Cluster role saved: ${result}`);
        return res.status(200).send(`Cluster role ${JSON.parse(req.body.clusterrole)} saved`);
      })
      .catch((err) => {
        console.log(`Clusterrole ${JSON.parse(req.body.clusterrole)} not saved: ${err}`);
        return res.status(500).send(`Clusterrole not saved for role ${req.body.clusterrole}`);
      });
};

// Upload  cluster object manisfet, this is to use for object where there is no template.
// Saves the file in "cluster" directory
const uploadClusterObjectYaml = async function(req, res) {
  const repolocation = `${GIT_REPO_BASEPATH }${req.body.repoName}/cluster/`;
  saveFile(req, req.body.filename, repolocation)
      .then((resp) => {
        res.status(200).send(resp);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
};

module.exports = {
  deployOperator: deployOperator,
  getClusters: getClusters,
  labelCluster: labelCluster,
  createClusterRole: createClusterRole,
  createClusterSelector: createClusterSelector,
  uploadClusterObjectYaml: uploadClusterObjectYaml,
};
