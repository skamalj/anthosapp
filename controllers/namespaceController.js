/* eslint-disable max-len */

const fs = require('fs');
const config = require('config');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');
const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');
const anthosfs = require('./anthosFSController');
const {saveFile} = require('./anthosFSController');

// Create namespace object in requested repository. It creates a directory with NS name
// and then places a namespace YAML in that directory. If nammespace is Abstract, then
// only directory is created.
const createNamespace = function(req, res) {
  const values = {NAMESPACE: JSON.parse(req.body.namespace), LABELS: JSON.parse(req.body.labelrows),
    CLUSTER_SELECTOR: JSON.parse(req.body.clusterselector)};
  const template = `${TEMPLATE_PATH}namespace.tpl`;

  const nsdir = `${JSON.parse(req.body.nscontext)}${values.NAMESPACE}`;
  const repolocation = `${nsdir}/${values.NAMESPACE}.yaml`;

  try {
    if (!fs.existsSync(nsdir)) {
      fs.mkdirSync(nsdir);
      if (JSON.parse(req.body.abstractnamespace)) {
        console.log(`Namespace saved: ${values.NAMESPACE}`);
        return res.status(200).send(`Namespace saved: ${values.NAMESPACE}`);
      }
    }
  } catch (err) {
    console.log(`Namespace not saved: ${err}`);
    return res.status(500).send(`Namespace not saved for ${values.NAMESPACE}`);
  }

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Namespace saved: ${values.NAMESPACE}`);
        return res.status(200).send(`Namespace saved: ${result}`);
      })
      .catch((err) => {
        console.log(`Namespace not saved: ${err}`);
        return res.status(500).send(`Namespace not saved for ${values.NAMESPACE}`);
      });
};

// Create and send list of empty abstract namespaces.
// These can be reviewed and deleted by the user
const listEmptyNS = function(req, res) {
  const reponame = JSON.parse(req.body.repoName);
  const repodir = `${GIT_REPO_BASEPATH}${reponame}/`;
  createEmptyNSList(repodir, [])
      .then((result) => {
        console.log(`Created list of empty abstract namespaces: ${JSON.stringify(result)}`);
        res.status(200).send(result);
      })
      .catch((err) => {
        console.log(`Could not create list of empty abstract namespaces: ${err}`);
        res.status(200).send('Error while creating list of empty abstract namespaces');
      });
};

// Helper function to create list of empty abstract NS's
const createEmptyNSList = async function(dirpath, result) {
  return new Promise((resolve, reject) => {
    try {
      const dirents = fs.readdirSync(dirpath, {withFileTypes: true});
      dirents.filter((dirent) => dirent.isDirectory() && dirent.name != '.git')
          .forEach( (d) => {
            if (fs.readdirSync(`${dirpath}${d.name}/`, {withFileTypes: true}).length == 0) {
              result.push({'name': d.name, 'nspath': `${dirpath}${d.name}/`});
            }
            createEmptyNSList(`${dirpath}${d.name}/`, result);
          });
      return resolve(result);
    } catch (err) {
      return reject(err);
    };
  });
};

// Upload object manisfet, this is to use for object where there is no template.
// Saves the file in namespace context sent in the request
const uploadObjectYaml = function(req, res) {
  console.log(JSON.stringify(req.body));
  const repolocation = req.body.nscontext;
  saveFile(req, req.body.filename, repolocation)
      .then((resp) => {
        res.status(200).send(resp);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
};

const createNetworkPolicy = function(req, res) {
  const template = `${TEMPLATE_PATH}custom-network-policy.tpl`;

  const FROM_RULES = JSON.parse(req.body.rules).filter((r) => r.ruletype == 'ingress');
  const TO_RULES = JSON.parse(req.body.rules).filter((r) => r.ruletype == 'egress');
  const values = {POLICY_NAME: JSON.parse(req.body.networkpolicyname)};

  const nsdir = JSON.parse(req.body.nscontext);
  const repolocation = `${nsdir}${values.POLICY_NAME}-np.yaml`;

  if (FROM_RULES.length > 0) {
    values.INGRESS = FROM_RULES;
  }
  if (FROM_RULES.length > 0) {
    values.EGRESS = TO_RULES;
  }

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Network Policy saved: ${result}`);
        return res.status(200).send(`Network Policy saved: ${values.POLICY_NAME}`);
      })
      .catch((err) => {
        console.log(`Network Policy not saved: ${err}`);
        return res.status(500).send(`Network Policy not saved for ${values.POLICY_NAME}`);
      });
};

const createDefaultNetworkPolicy = function(req, res) {
  let template;
  let repolocation;
  const nsdir = req.body.nscontext;
  console.log(JSON.stringify(req.body));
  if (req.body.policytype == 'default-deny-all-ingress') {
    template = `${TEMPLATE_PATH}default-deny-all-ingress.tpl`;
    repolocation = `${nsdir}default-deny-all-ingress-np.yaml`;
  } else {
    template = `${TEMPLATE_PATH}default-deny-all-egress.tpl`;
    repolocation = `${nsdir}default-deny-all-egress-np.yaml`;
  }

  anthosfs.compileTemplateToRepo(template, {CLUSTER_SELECTOR: req.body.clusterselector}, repolocation)
      .then((result) => {
        console.log(`Default Network Policy saved: ${result}`);
        return res.status(200).send(`Default Network Policy saved: ${req.body.policytype}`);
      })
      .catch((err) => {
        console.log(`Default Network Policy not saved: ${err}`);
        return res.status(500).send(`Default Network Policy not saved for ${req.body.policytype}`);
      });
};

module.exports = {
  createNamespace: createNamespace,
  listEmptyNS: listEmptyNS,
  createEmptyNSList, createEmptyNSList,
  uploadObjectYaml: uploadObjectYaml,
  createNetworkPolicy: createNetworkPolicy,
  createDefaultNetworkPolicy: createDefaultNetworkPolicy,
};
