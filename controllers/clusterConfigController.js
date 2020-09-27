/* eslint-disable max-len */
const config = require('config');
const {spawn} = require('child_process');
const fs = require('fs');
const handlebars = require('handlebars');

const OPERATOR_PATH = config.get('OPERATOR_PATH');
const KUBE_CONFIG_BASEPATH = config.get('KUBE_CONFIG_BASEPATH');
const GIT_CONFIG_BASEPATH = config.get('GIT_CONFIG_BASEPATH');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');


const deployOperator = function(req, res) {
  const deployOperator = `kubectl apply -f ${OPERATOR_PATH} \
    --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName}`;
  const gitsecret = `kubectl create secret generic git-creds --namespace=config-management-system \
    --from-file=ssh=${GIT_CONFIG_BASEPATH}${req.body.repoName} --dry-run -o yaml | \
    kubectl apply --kubeconfig ${KUBE_CONFIG_BASEPATH}${req.body.clusterName} -f -`;

  const repo = fs.readFileSync(`${GIT_CONFIG_BASEPATH}gitrepos.config`, 'utf-8');
  const repoFullName = (JSON.parse(repo)).repos.filter((r) => r.repoName === req.body.repoName);
  console.log(repoFullName[0].repo);
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
      .then(() => res.status(200).send('Operator deployed successfully'))
      .catch((err) => res.status(500).send(err));
};

const runKubectl = function(cmd) {
  return new Promise(async (resolve, reject) => {
    const kubectlProcess = spawn(cmd, {detached: true, shell: true});

    kubectlProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    kubectlProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
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


module.exports = {
  deployOperator: deployOperator,
};
