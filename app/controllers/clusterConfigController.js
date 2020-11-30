/* eslint-disable max-len */
const config = require('config');
const {spawn} = require('child_process');
const fs = require('fs');
const handlebars = require('handlebars');
const yaml = require('yaml');
const {compileTemplateToRepo, saveFile, getObjectYaml} = require('./anthosFSController');


// Configurations are set in /config app directory in default.json
const CONNECT_SA_JSON_PATH = `${config.get('DATA_PATH')}/.config/connect-sa4.json`
const GIT_REPO_BASEPATH = `${config.get('DATA_PATH')}/.repos/`;
const KUBE_CONFIG_BASEPATH = `${config.get('DATA_PATH')}/.config/kube/`;
const GIT_CONFIG_BASEPATH = `${config.get('DATA_PATH')}/.config/git/`;
const TEMPLATE_PATH = `${config.get('BASE_PATH')}/templates/`;
const OPERATOR_PATH = `${config.get('BASE_PATH')}/.anthos-operator/config-management-operator.yaml`;

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
  execCmd(deployOperator, 'Kubectl')
      .then((data) => execCmd(gitsecret, 'Kubectl'))
      .then((data)=> execCmd(applyOperatorConfig, 'Kubectl'))
      .then((data) => {
        const msg = `Operator deployed successfully for cluster ${req.body.clusterName}`;
        res.status(200).send(msg);
      })
      .catch((err) => {
        const msg = `Operator for cluster ${req.body.clusterName} could not be deploued`;
        console.log(`msg: ${err}`);
        res.status(500).send(msg);
      });
};

const createConnectLoginToken = function(clustername, username) {
  const KSA_NAME = `${username}-hub-login-sa`;
  const KUBECONFIG_CONTEXT = clustername;
  const KUBECONFIG_PATH = `${KUBE_CONFIG_BASEPATH}${clustername}`;
  const CHECK_IF_CLUSTER_SA_EXISTS_CMD = `KUBECONFIG=${KUBECONFIG_PATH} kubectl get sa -o custom-columns=Name:.metadata.name \
  --field-selector=metadata.name=${KSA_NAME} --no-headers=true -n default`;
  const CREATE_KSA = `KUBECONFIG=${KUBECONFIG_PATH} kubectl create serviceaccount ${KSA_NAME} -n default`;
  const CREATE_VIEW_ROLE_BIND = `KUBECONFIG=${KUBECONFIG_PATH} kubectl create clusterrolebinding ${KSA_NAME}-view-bind \
--clusterrole view --serviceaccount default:${KSA_NAME}`;
  const CREATE_CONSOLE_READER_BIND = `KUBECONFIG=${KUBECONFIG_PATH} kubectl create clusterrolebinding ${KSA_NAME}-console-reader-bind \
--clusterrole cloud-console-reader --serviceaccount default:${KSA_NAME}`;
  const GET_KSA_SECRET_NAME = `KUBECONFIG=${KUBECONFIG_PATH} kubectl get serviceaccount ${KSA_NAME} \
-o jsonpath='{$.secrets[0].name}' -n default`;
  const GET_SECRET_TOKEN = function(SECRET_NAME) { 
    return `KUBECONFIG=${KUBECONFIG_PATH} kubectl get secret ${SECRET_NAME} -o jsonpath='{$.data.token}' -n default`
  };

  return execCmd(CHECK_IF_CLUSTER_SA_EXISTS_CMD, 'kubectl')
  .then((data) => KSA_NAME == data.trim())
  .then((ksa_exists) => {
    if(ksa_exists) {
      return execCmd(GET_KSA_SECRET_NAME, 'kubectl')
      .then((data) => execCmd(GET_SECRET_TOKEN(data.trim()), 'kubectl'))
    } else {
      return execCmd(CREATE_KSA, 'kubectl')
      .then((data) => execCmd(CREATE_VIEW_ROLE_BIND, 'kubectl'))
      .then((data) => execCmd(CREATE_CONSOLE_READER_BIND, 'kubectl'))
      .then((data) => execCmd(GET_KSA_SECRET_NAME, 'kubectl'))
      .then((data) => execCmd(GET_SECRET_TOKEN(data.trim()), 'kubectl'))
    }
  })
}

const getConnectLoginToken = function(req, res) {
  createConnectLoginToken(req.body.clusterName, req.body.username)
  .then((data) => {
    token = data.trim();
    return res.status(200).send(Buffer.from(token, 'base64').toString('utf-8'));
  }).catch((err) => {
    console.log(`Token not generated: ${err}`)
    return res.status(500).send('Token could not be generated');

  })
}
const connectCluster = function (req, res) {
  createHubSAJson()
  .then(() => deployConnectOperator(req.body.clusterName))
  .then(() => {
    res.status(200).send(`Connect Operator deployed to ${req.body.clusterName}`);
  })
  .catch((err) => {
    console.log(`Error: Connect Operator not deployed to ${req.body.clusterName}: ${err}`)
    res.status(200).send(`Error: Connect Operator not deployed to ${req.body.clusterName}`);
  })
};


const disconnectCluster = function (req, res) {
  deleteConnectOperator(req.body.clusterName)
  .then(() => {
    res.status(200).send(`Connect Operator delete from  ${req.body.clusterName}`);
  })
  .catch((err) => {
    if(err.code == 'MEMBERSHIP_NOT_EXIST') {
      console.log(`Error occurred when deleting connect operator from ${req.body.clusterName}: ${err}`);
      res.status(200).send(`Error occurred when deleting connect operator from ${req.body.clusterName}: ${err}`);
    } else {
      console.log(`Error occurred when deleting connect operator from ${req.body.clusterName}: ${err}`);
      res.status(200).send(`Error occurred when deleting connect operator from  ${req.body.clusterName}`);
    }
  })
};

const deployConnectOperator = function(clustername) {
  const MEMBERSHIP_NAME = `${clustername}-hub`;
  const KUBECONFIG_CONTEXT = clustername;
  const KUBECONFIG_PATH = `${KUBE_CONFIG_BASEPATH}${clustername}`;
  const DEPLOY_OPERATOR_CMD = ` gcloud container hub memberships register ${MEMBERSHIP_NAME} \
  --context=${KUBECONFIG_CONTEXT} \
  --kubeconfig=${KUBECONFIG_PATH} \
  --service-account-key-file=${CONNECT_SA_JSON_PATH}`;

  return checkIfConnectMembershipExists(clustername)
        .then((data) => { return data.trim() == MEMBERSHIP_NAME})
        .then((already_deployed) => {
          if (!already_deployed) return execCmd(DEPLOY_OPERATOR_CMD, 'Gcloud');
          else return;
        })
}

const deleteConnectOperator = function(clustername) {
  const MEMBERSHIP_NAME = `${clustername}-hub`;
  const KUBECONFIG_CONTEXT = clustername;
  const KUBECONFIG_PATH = `${KUBE_CONFIG_BASEPATH}${clustername}`;
  const DELETE_OPERATOR_CMD = ` gcloud container hub memberships unregister ${MEMBERSHIP_NAME} \
  --context ${KUBECONFIG_CONTEXT} --kubeconfig ${KUBECONFIG_PATH}`;

  return checkIfConnectMembershipExists(clustername)
        .then((data) => { return data.trim() == MEMBERSHIP_NAME})
        .then((deployed) => {
          if (deployed) return execCmd(DELETE_OPERATOR_CMD, 'Gcloud');
          else {
            let err = new Error(`Membership ${MEMBERSHIP_NAME} does not exist, nothing to delete`);
            err.code = 'MEMBERSHIP_NOT_EXIST';
            throw err;
          }
        })
}

const checkIfConnectMembershipExists = function(clustername) {
  const FULL_MEMBERSHIP_NAME = function(PID) { return`projects/${PID}/locations/global/memberships/${clustername}-hub`}
  const GET_GCP_PROJECT_ID = `gcloud config list --format 'value(core.project)'`;
  const CHECK_IF_MEMBERSHIP_EXISTS =  function(PID) { return `gcloud container hub memberships list \
  --filter='${FULL_MEMBERSHIP_NAME(PID)}' --format='value(name)'`}

  return execCmd(GET_GCP_PROJECT_ID, 'Gcloud')
        .then((data) => execCmd(CHECK_IF_MEMBERSHIP_EXISTS(data.trim()), 'Gcloud'));
}

const createHubSAJson = function() {
  let PROJECT_ID = '';
  const MEMBERSHIP_SA = 'membership-sa4';
  const MEMBERSHIP_SA_EMAIL = function(PID) { return `${MEMBERSHIP_SA}@${PID}.iam.gserviceaccount.com` }
  const CHECK_HUB_SA_EXISTS = function(PID) {return `gcloud iam service-accounts list \
  --filter="email=${MEMBERSHIP_SA}@${PID}.iam.gserviceaccount.com" --format "value(email)"`}
  const GET_GCP_PROJECT_ID = `gcloud config list --format 'value(core.project)'`;
  const CREATE_HUB_SA_GC_CMD = function(PID) { return `gcloud iam service-accounts create ${MEMBERSHIP_SA} --project=${PID}` }
  const BIND_ROLE_TO_HUB_SA = function(PID) { return `gcloud projects add-iam-policy-binding ${PID} \
  --member="serviceAccount:${MEMBERSHIP_SA}@${PID}.iam.gserviceaccount.com" --role="roles/gkehub.connect"` }
  const CREATE_HUB_SA_JSON= function(PID) { return `gcloud iam service-accounts keys create ${CONNECT_SA_JSON_PATH} \
  --iam-account=${MEMBERSHIP_SA}@${PID}.iam.gserviceaccount.com  --project=${PID}` }
  
  return new Promise((resolve, reject) => {
    try {
      fs.statSync(CONNECT_SA_JSON_PATH);
      return resolve();
    } catch (err) { 
    if (err.code == 'ENOENT') {
      return execCmd(GET_GCP_PROJECT_ID, 'Gcloud')
            .then((data) => PROJECT_ID = data.trim())
            .then(() =>execCmd(CHECK_HUB_SA_EXISTS(PROJECT_ID), 'Gcloud'))
            .then((data) => { return data.trim() == MEMBERSHIP_SA_EMAIL(PROJECT_ID)})
            .then((sa_exists) => {
                if(sa_exists) {
                  return execCmd(CREATE_HUB_SA_JSON(PROJECT_ID), 'Gcloud');
                }
                else
                  return execCmd(CREATE_HUB_SA_GC_CMD(PROJECT_ID), 'Gcloud')
                          .then((data) => execCmd(BIND_ROLE_TO_HUB_SA(PROJECT_ID), 'Gcloud'))
                          .then((data) => execCmd(CREATE_HUB_SA_JSON(PROJECT_ID), 'Gcloud'));
            })
            .then((data) => resolve())
            .catch((err) => {
                console.log(`Could not create SA JSON: ${err}`)
                return reject(err);
              })
    }
    else {
      return reject(err);
    }
  } 
  })   
}

// Execute kubectl command. Assumption here is that 'close' will be executed after stdout or stderr.
// So far has been ok, but may need relook if this assumption turns out incorrect.
const execCmd = async function(cmd, type) {
  return new Promise(async (resolve, reject) => {
    const cmdProcess = spawn(cmd, {detached: true, shell: true});
    var outdata = '';
    cmdProcess.stdout.on('data', (data) => {
      outdata += data.toString();
      console.log(`${type} stdout: ${data}`);
    });
    cmdProcess.stderr.on('data', (data) => {
      console.error(`${type} stderr: ${data}`);
    });
    cmdProcess.on('close', (code) => {
      console.log(`${type} command: ${cmd} exited with code ${code}`);
      if (code != 0) {
        reject(new Error(`Failed to execute ${type} command: ${cmd}`));
      } else {
        console.log('Data on close:' + outdata)
        resolve(outdata);
      }
    });
  });
};

// Execute Nomos command. The trick here is to list all kubeconfigs which are generated by the tool
// , concatenate these and then use them with nomos command. KUBECONFIG="...files..."
// ToDo: There is no filter applied to the base repo, before cheking the status. Result is command 
// returns status of all clusters irrespetive of which repo they are connected to. 
const runNomos = async function(req, res) {
  const dirents = fs.readdirSync(KUBE_CONFIG_BASEPATH, {withFileTypes: true});
  clusterlist = '';
  dirents.map((d) => {
    if (!d.name.includes('yaml')) {
      clusterlist = clusterlist + KUBE_CONFIG_BASEPATH + d.name + ':';
    }
  });
  let stdout = '';
  let stderr = '';
  const cmd = `KUBECONFIG=${clusterlist} nomos status`;
  const nomosProcess = spawn(cmd, {detached: true, shell: true});

  nomosProcess.stdout.on('data', (data) => {
    stdout = data.toString('utf8');
  });
  nomosProcess.stderr.on('data', (data) => {
    stderr = data.toString('utf8');
  });
  nomosProcess.on('close', (code) => {
    console.log(`Nomos command: ${cmd} exited with code ${code}\nstdout: ${stdout}\nstderr: ${stderr}\n`);
    return res.status(200).send(JSON.stringify({stdout: stdout, stderr: stderr}));
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
    return res.status(200).send(clusters.filter((c) => (c)));
  } catch (err) {
    console.log(`Cannot create cluster list ${err}`);
    return res.status(500).send('Cannot create cluster list');
  }
};

// ToDo: Delete cluster

// Returns mapping of which cluster resource is attached to which repository
const getRepoClusterMapping = function() {
  return new Promise(async (resolve, reject) => {
    let clusterrepos;
    try {
      // Read git configuration - repoName and repoURI
      const gitconfigs  = fs.readFileSync(`${GIT_CONFIG_BASEPATH}gitrepos.config`,'utf-8');
      const gitconfigjson = JSON.parse(gitconfigs)
      // Read cluster configmanagement yamls to identify repoURI attached to clusters
      // Then join this with git cofig to get repo name
      const dirents = fs.readdirSync(KUBE_CONFIG_BASEPATH, {withFileTypes: true});
      clusterrepos = dirents.filter((dir) => dir.name.includes('.yaml')).map((file) => {
        const clusterconfig = fs.readFileSync(`${KUBE_CONFIG_BASEPATH}${file.name}`, 'utf-8');
        const clusterconfigjson = yaml.parseDocument(clusterconfig);
        const clusterspec =   (JSON.parse(JSON.stringify(clusterconfigjson.contents)))['spec'];
        const clustername = clusterspec.clusterName;
        const clusterrepouri = clusterspec.git.syncRepo;
        const reponame = gitconfigjson.repos.filter(r => r.repo == clusterrepouri)[0].repoName
        return {clustername: clustername, reponame: reponame};
      })
      return resolve(clusterrepos);
    } catch (err) {
      console.log(`Error when creating cluster-repo mapping: ${err}`);
      return reject(err);
    }  
  });  
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

// Create manifest for clusterrolebinding
const createClusterRoleBinding = async function(req, res) {
  const values = {CLUSTER_ROLE_BINDING: req.body.clusterrolebinding, CLUSTER_SELECTOR: req.body.clusterselector,
    CLUSTER_ROLE: req.body.clusterrole, SUBJECTS: JSON.parse(req.body.subjects)};

  const template = `${TEMPLATE_PATH}clusterrolebinding.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${req.body.repoName}/cluster`;
  repolocation = `${repolocation}/${req.body.clusterrolebinding}.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        console.log(`Cluster role binding saved: ${result}`);
        return res.status(200).send(`Cluster role ${req.body.clusterrolebinding} saved`);
      })
      .catch((err) => {
        console.log(`Clusterrolebinding ${req.body.clusterrolebinding} not saved: ${err}`);
        return res.status(500).send(`Clusterrolebinding not saved for binding ${req.body.clusterrolebinding}`);
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

// This function returns current labels attached to the cluster, so that these can be updated
const getClusterLabels = function(req, res) {
  try {
    let fpath = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/clusterregistry`;
    fpath = `${fpath}/${JSON.parse(req.body.clustername)}-labels.yaml`;
    const clusteryaml = getObjectYaml(fpath);
    if (clusteryaml) {
      let labels = clusteryaml.metadata.labels;
      labels = (Object.keys(labels)).map((k) => {
        const label = {}; label[k] = labels[k]; return label;
      });
      res.status(200).send(labels);
    } else {
      res.status(200).send([]);
    }
  } catch (err) {
    console.log(`Error reading labels form ${JSON.parse(req.body.clustername)}: ${err}`);
    res.send(500).send(`Error reading labels form ${JSON.parse(req.body.clustername)}`);
  }
};
module.exports = {
  deployOperator: deployOperator,
  getClusters: getClusters,
  labelCluster: labelCluster,
  createClusterRole: createClusterRole,
  createClusterRoleBinding: createClusterRoleBinding,
  createClusterSelector: createClusterSelector,
  uploadClusterObjectYaml: uploadClusterObjectYaml,
  runNomos: runNomos,
  getClusterLabels: getClusterLabels,
  getRepoClusterMapping: getRepoClusterMapping,
  connectCluster: connectCluster,
  disconnectCluster: disconnectCluster,
  getConnectLoginToken: getConnectLoginToken,
};
