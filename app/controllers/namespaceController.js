/* eslint-disable max-len */

const fs = require('fs');
const config = require('config');
const GIT_REPO_BASEPATH = `${config.get('DATA_PATH')}/.repos/`;
const TEMPLATE_PATH = `${config.get('BASE_PATH')}/templates/`;
const anthosfs = require('./anthosFSController');
const {compileTemplateToRepo, saveFile} = require('./anthosFSController');

// Create namespace object in requested repository. It creates a directory with NS name
// and then places a namespace YAML in that directory. If nammespace is Abstract, then
// only directory is created.
const createNamespace = async function(req, res) {
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
    res.status(500).send(`Namespace not saved for ${values.NAMESPACE}`);
  }

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Namespace saved: ${result}`);
        res.status(200).send(`Namespace saved: ${values.NAMESPACE}`);
      })
      .catch((err) => {
        console.log(`Namespace not saved: ${err}`);
        res.status(500).send(`Namespace not saved for ${values.NAMESPACE}`);
      });
};

// Create and send list of empty abstract namespaces.
// These can be reviewed and deleted by the user
const listEmptyNS = async function(req, res) {
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
const uploadObjectYaml = async function(req, res) {
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

const createSecret = function(req, res) {
  const nsdir = req.body.nscontext;
  var template;
  var repolocation;
  var values = {SECRET_NAME: req.body.secretname};
  console.log(typeof(req.body.datarows));

  if (req.body.secrettype == 'dockerConfig') {
    template = `${TEMPLATE_PATH}SECRETS/dockerconfig.tpl`;
    repolocation = `${nsdir}${req.body.secretname}-docker-secret.yaml`;
    values.DOCKER_CONFIG = req.files.configjson.data.toString('base64');
  } else if (req.body.secrettype == 'tls') {
    template = `${TEMPLATE_PATH}SECRETS/tls.tpl`;
    repolocation = `${nsdir}${req.body.secretname}-tls.yaml`;
    values.CRT_FILE = req.files.crtfile.data.toString('base64');
    values.KEY_FILE = req.files.keyfile.data.toString('base64');
  } else if (req.body.secrettype == 'generic') {
    template = `${TEMPLATE_PATH}SECRETS/generic.tpl`;
    repolocation = `${nsdir}${req.body.secretname}-generic.yaml`;
    values.DATA = {};
    JSON.parse(req.body.datarows).forEach(d => Object.keys(d).forEach(k => {
      values.DATA[k] = Buffer.from(d[k],'utf-8').toString('base64');
    }))
  }

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Secret saved: ${result}`);
        res.status(200).send(`Secret saved: ${values.SECRET_NAME}`);
      })
      .catch((err) => {
        console.log(`Secret not saved: ${err}`);
        res.status(500).send(`Secret not saved: ${values.SECRET_NAME}`);
      });
};

// Create network policy. This is used for both egress and ingress policies
const createNetworkPolicy = async function(req, res) {
  const template = `${TEMPLATE_PATH}custom-network-policy.tpl`;

  const FROM_RULES = JSON.parse(req.body.rules).filter((r) => r.ruletype == 'ingress');
  const TO_RULES = JSON.parse(req.body.rules).filter((r) => r.ruletype == 'egress');
  const values = {POLICY_NAME: JSON.parse(req.body.networkpolicyname),
    POLICY_POD_SELECTOR_KEY: JSON.parse(req.body.policypodselectorkey),
    POLICY_POD_SELECTOR_VALUE: JSON.parse(req.body.policypodselectorvalue)};

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
        res.status(200).send(`Network Policy saved: ${values.POLICY_NAME}`);
      })
      .catch((err) => {
        console.log(`Network Policy not saved: ${err}`);
        res.status(500).send(`Network Policy not saved for ${values.POLICY_NAME}`);
      });
};

// Create default network policy. This function creates two so far, deny-all-egress
// and deny-all-ingress
const createDefaultNetworkPolicy = async function(req, res) {
  let template;
  let repolocation;
  const nsdir = req.body.nscontext;

  if (req.body.policytype == 'default-deny-all-ingress') {
    template = `${TEMPLATE_PATH}default-deny-all-ingress.tpl`;
    repolocation = `${nsdir}default-deny-all-ingress-np.yaml`;
  } else {
    template = `${TEMPLATE_PATH}default-deny-all-egress.tpl`;
    repolocation = `${nsdir}default-deny-all-egress-np.yaml`;
  }

  const values = {};
  values.SELECTORS = [];
  if (req.body.clusterselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'cluster-selector', CLUSTER_SELECTOR: req.body.clusterselector});
  }
  if (req.body.namespaceselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'namespace-selector', CLUSTER_SELECTOR: req.body.namespaceselector});
  }

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Default Network Policy saved: ${result}`);
        res.status(200).send(`Default Network Policy saved: ${req.body.policytype}`);
      })
      .catch((err) => {
        console.log(`Default Network Policy not saved: ${err}`);
        res.status(500).send(`Default Network Policy not saved for ${req.body.policytype}`);
      });
};

// Creates resourcequota  k8s object.
const createResourceQuotas = async function(req, res) {
  const nsdir = req.body.nscontext;
  const repolocation = `${nsdir}${req.body.resourcequotasname}-rq.yaml`;

  const template = `${TEMPLATE_PATH}ns-resource-quotas.tpl`;

  const values = {RESOURCE_QUOTAS_NAME: req.body.resourcequotasname,
    CPU_LIMIT: req.body.cpulimit, MEMORY_LIMIT: req.body.memorylimit,
    NO_OF_PODS: req.body.limitnoofpods, NO_OF_JOBS: req.body.limitnoofjobs};

  values.SELECTORS = [];
  if (req.body.clusterselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'cluster-selector', CLUSTER_SELECTOR: req.body.clusterselector});
  }
  if (req.body.namespaceselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'namespace-selector', CLUSTER_SELECTOR: req.body.namespaceselector});
  }

  console.log(JSON.stringify(values));

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`ResourceQuota saved: ${result}`);
        res.status(200).send(`ResourceQuota saved: ${req.body.resourcequotasname}`);
      })
      .catch((err) => {
        console.log(`ResourceQuota not saved: ${err}`);
        res.status(500).send(`ResourceQuota not saved for ${req.body.resourcequotasname}`);
      });
};

// Create namespace selector and save it in clusterregistry
const createNamespaceSelector = async function(req, res) {
  // Set values for templates
  const values = {SELECTOR_NAME: JSON.parse(req.body.selectorname),
    KIND: 'NamespaceSelector',
    APIVERSION: 'configmanagement.gke.io/v1',
    LABELS: JSON.parse(req.body.labelrows)};

  // Get the template, this temlate is used by both clusterselector as well as namespaceselector
  const template = `${TEMPLATE_PATH}anthos-selector.tpl`;

  // Set filelocation and name for selector
  let repolocation = req.body.nscontext;
  repolocation = `${repolocation}${JSON.parse(req.body.selectorname)}-nsselector.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`NamespaceSelector saved: ${result}`);
        return res.status(200).send(`NamespaceSelector saved: ${JSON.parse(req.body.selectorname)}`);
      })
      .catch((err) => {
        console.log(`NamespaceSelector ${JSON.parse(req.body.selectorname)} not saved: ${err}`);
        return res.status(500).send(`NamespaceSelector  ${JSON.parse(req.body.selectorname)} not saved`);
      });
};

// Creates resourcequota  k8s object.
const createDeployment = async function(req, res) {
  const nsdir = req.body.nscontext;
  const repolocation = `${nsdir}${req.body.deploymentname}-dep.yaml`;

  const template = `${TEMPLATE_PATH}deploy-image.tpl`;

  const values = {NAME: req.body.deploymentname,
    IMAGE: req.body.image, REPLICAS: req.body.replicas,
    PORT: req.body.port, SERVICE_PORT: req.body.serviceport};

  values.SELECTORS = [];
  if (req.body.clusterselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'cluster-selector', CLUSTER_SELECTOR: req.body.clusterselector});
  }
  if (req.body.namespaceselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'namespace-selector', CLUSTER_SELECTOR: req.body.namespaceselector});
  }

  console.log(JSON.stringify(values));

  anthosfs.compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Deployment created: ${result}`);
        res.status(200).send(`Deployment created: ${req.body.deploymentname}`);
      })
      .catch((err) => {
        console.log(`Deployment could not be created: ${err}`);
        res.status(500).send(`Deployment could not be created for ${req.body.deploymentname}`);
      });
};

// Create manifest for role
const createRole = async function(req, res) {

  const values = {ROLE_NAME: req.body.role, RULES: JSON.parse(req.body.rules)};

  values.SELECTORS = [];
  if (req.body.clusterselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'cluster-selector', CLUSTER_SELECTOR: req.body.clusterselector});
  }
  if (req.body.namespaceselector) {
    values.SELECTORS.push({CLUSTER_TYPE: 'namespace-selector', CLUSTER_SELECTOR: req.body.namespaceselector});
  }

  // Set template
  const template = `${TEMPLATE_PATH}role.tpl`;

  // Set filelocation and name for selector
  let repolocation = req.body.nscontext;
  repolocation = `${repolocation}${req.body.role}.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Role saved: ${result}`);
        return res.status(200).send(`Role ${req.body.role} saved`);
      })
      .catch((err) => {
        console.log(`Role ${req.body.role} not saved: ${err}`);
        return res.status(500).send(`Role not saved for ${req.body.role}`);
      });
};

// Create manifest for rolebinding
const createRoleBinding = async function(req, res) {
  const values = {ROLE_BINDING: req.body.rolebinding, CLUSTER_SELECTOR: req.body.clusterselector,
    NAMESPACE_SELECTOR: req.body.namespaceselector,ROLE: req.body.role, 
    SUBJECTS: JSON.parse(req.body.subjects)};

  const template = `${TEMPLATE_PATH}rolebinding.tpl`;
  let repolocation = `${req.body.nscontext}/${req.body.rolebinding}.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Role binding saved: ${result}`);
        return res.status(200).send(`Role ${req.body.rolebinding} saved`);
      })
      .catch((err) => {
        console.log(`Rolebinding ${req.body.rolebinding} not saved: ${err}`);
        return res.status(500).send(`Rolebinding not saved for binding ${req.body.rolebinding}`);
      });
};


module.exports = {
  createNamespace: createNamespace,
  createNamespaceSelector: createNamespaceSelector,
  listEmptyNS: listEmptyNS,
  createEmptyNSList, createEmptyNSList,
  uploadObjectYaml: uploadObjectYaml,
  createNetworkPolicy: createNetworkPolicy,
  createDefaultNetworkPolicy: createDefaultNetworkPolicy,
  createResourceQuotas: createResourceQuotas,
  createDeployment: createDeployment,
  createRole: createRole,
  createRoleBinding: createRoleBinding,
  createSecret: createSecret,
};
