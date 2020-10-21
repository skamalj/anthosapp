/* eslint-disable no-tabs */
/* eslint-disable max-len */
const simpleGit = require('simple-git');
const {spawn} = require('child_process');
const fs = require('fs');
const config = require('config');
const git = simpleGit('/home/skamalj/anthosui/.repos', {binary: 'git'});
const handlebars = require('handlebars');


const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');
const KUBE_CONFIG_BASEPATH = config.get('KUBE_CONFIG_BASEPATH');
const GIT_CONFIG_BASEPATH = config.get('GIT_CONFIG_BASEPATH');
const SSH_CONFIG_FILE = config.get('SSH_CONFIG_FILE');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');

handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

const saveAnthosConfig = function(req, res) {
  if (req.body.credoption === 'token') {
    try {
      const kubetemplate = fs.readFileSync(`${TEMPLATE_PATH}kubeconfig.tpl`, 'utf8');
      const template = handlebars.compile(kubetemplate);

      const result = template({
        CLUSTER_ENDPOINT: req.body.clusterendpoint,
        CLUSTER_NAME: req.body.clustername,
        SERVICE_ACCOUNT: req.body.serviceaccount,
        TOKEN: req.body.token,
      });

      fs.writeFileSync(`${KUBE_CONFIG_BASEPATH}${req.body.clustername}`, result);
      console.log(`Config for cluster ${req.body.clustername} saved at ${KUBE_CONFIG_BASEPATH}${req.body.clustername}`);
      res.status(200).send(`Config for cluster ${req.body.clustername} saved`);
    } catch (err) {
      console.log(`Config for cluster ${req.body.clustername} not saved: ${err}`);
      res.status(500).send(`Config for cluster ${req.body.clustername} not saved`);
    }
  }
};

const saveGitRepo = function(req, res) {
  saveFile(req, req.body.repoName, GIT_CONFIG_BASEPATH)
      .then((filepath) => updateSSHConfig(req, filepath))
      .then(() => initializeGitRepo(req))
      .then(() => syncGitRepo(`${GIT_REPO_BASEPATH}${req.body.repoName}`))
      .then(() => saveRepoDetails(req))
      .then(() => res.status(200).send(`Repository ${req.body.repoName} saved and initialized`))
      .catch((err) => {
        console.log(err);
        return res.status(500).send('Repository could not created or synced');
      });
};

const saveFile = function(req, filename, location) {
  return new Promise(async (resolve, reject) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('No files were uploaded');
      reject(new Error('No file was uploaded.'));
    }
    // Get the key defined in frontend for file upload, this has no relation to filename
    fileKey = (Object.keys(req.files))[0];
    const tempFile = req.files[fileKey];
    // Use the mv() method to place the file somewhere on your server
    await tempFile.mv(`${location}${filename}`, function(err) {
      if (err) {
        console.log(err);
        reject(err);
      }
      console.log(`Uploaded file was saved to ${location}${filename}`);
      resolve(`${location}${filename}`);
    });
  });
};

const updateSSHConfig = function(req, filepath) {
  const re = new RegExp('@([^@]*):');
  const hostname = req.body.repo.match(re)[1];
  const host = `${req.body.repoName}-${hostname}`;
  const stricthostchecking = 'StrictHostKeyChecking no';
  const sshConfig = `Host ${host}\n\tHostName ${hostname}\n\tIdentityFile ${filepath}\n\t${stricthostchecking}\n`;

  return new Promise((resolve, reject) => {
    fs.appendFile(SSH_CONFIG_FILE, sshConfig, (err) => {
      if (err) {
        console.log(`Could not update SSH Config ${err}`);
        reject(err);
      } else {
        console.log(`SSH Config updated for repo ${req.body.repoName}`);
        resolve();
      }
    });
  });
};

const initializeGitRepo = function(req) {
  const processCwd = `${GIT_REPO_BASEPATH}${req.body.repoName}`;

  const re = new RegExp('@([^@]*):');
  const hostname = req.body.repo.match(re)[1];
  const host = `${req.body.repoName}-${hostname}`;
  const gitrepo = req.body.repo.replace(hostname, host);

  return new Promise(async (resolve, reject) => {
    await git.cwd(GIT_REPO_BASEPATH).clone(gitrepo, req.body.repoName)
        .then(() => {
          console.log(`Going to execute nomos: ${req.body.doNotInitializeRepo}`);
          if (req.body.doNotInitializeRepo == 'false') {
            console.log(`Executing nomos: ${processCwd}`);
            const pwd = spawn('nomos init --force', {detached: true, shell: true, cwd: processCwd});
            console.log(`Executing nomos: ${processCwd}`);
            pwd.stdout.on('data', (data) => {
              console.log(`stdout: ${data}`);
            });

            pwd.stderr.on('data', (data) => {
              console.error(`stderr: ${data}`);
            });

            pwd.on('close', (code) => {
              console.log(`Nomos initalization exited with code ${code}`);
              if (code != 0) {
                reject(new Error('Cannot initialize repository with nomos'));
              } else {
                resolve();
              }
            });
          }
          resolve();
        })
        .catch((err) => reject(err));
  });
};

const syncGitRepo = function(repoPath) {
  return new Promise((resolve, reject) => {
    git.cwd(repoPath)
        .add('./*')
        .commit('Dummy Message')
        .push()
        .exec(() => resolve())
        .catch((err) => reject(err));
  });
};

const saveRepoDetails = function(req) {
  const repo = req.body.repo;
  const identityFile = `${GIT_REPO_BASEPATH}${req.body.repoName}`;
  const repoName = req.body.repoName;
  let gitrepos = {repos: []};

  return new Promise(async (resolve, reject) => {
    try {
      fs.readFile(`${GIT_CONFIG_BASEPATH}gitrepos.config`, 'utf-8', (err, data) => {
        if (!err) {
          gitrepos = JSON.parse(data);
        }
        newRepo = {repoName: repoName, identityFile: identityFile, repo: repo};
        gitrepos.repos.push(newRepo);
        console.log(JSON.stringify(gitrepos));
        fs.writeFileSync(`${GIT_CONFIG_BASEPATH}gitrepos.config`, JSON.stringify(gitrepos));
        resolve();
      });
    } catch (err) {
      console.log(`New Repo ${repoName} not persisted to config: ${JSON.stringify(gitrepos)}`);
      reject(err);
    }
  });
};

const listGitRepos = function(req, res) {
  try {
    console.log('Request processing for repolist');
    const repolist = fs.readdirSync(GIT_REPO_BASEPATH, {withFileTypes: true})
        .filter((dirent) => dirent.isDirectory()).map((dirent) => {
          return {name: dirent.name};
        });
    console.log(JSON.stringify(repolist));
    res.status(200).send(repolist);
  } catch (err) {
    console.log('Repo list could not be generated');
    res.status(500).send('Error: Repository list not available');
  }
};

const labelCluster = function(req, res) {
  const values = {CLUSTER_NAME: JSON.parse(req.body.clustername), LABELS: JSON.parse(req.body.labelrows)};
  const template = `${TEMPLATE_PATH}cluster-labels.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/clusterregistry`;
  repolocation = `${repolocation}/${JSON.parse(req.body.clustername)}-labels.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        return res.status(200).send(`Cluster labels saved: ${result}`);
      })
      .catch((err) => {
        console.log(`Cluster labels not saved: ${err}`);
        return res.status(500).send(`Cluster labels not saved for cluster ${req.body.clustername}`);
      });
};

const createNamespace = function(req, res) {
  const values = {NAMESPACE: JSON.parse(req.body.namespace), LABELS: JSON.parse(req.body.labelrows),
    CLUSTER_SELECTOR: JSON.parse(req.body.clusterselector)};
  const template = `${TEMPLATE_PATH}namespace.tpl`;
  let repolocation = JSON.parse(req.body.nscontext);
  repolocation = `${repolocation}${JSON.parse(req.body.namespace)}.yaml`;
  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        return res.status(200).send(`Namespace saved: ${result}`);
      })
      .catch((err) => {
        console.log(`Namespace not saved: ${err}`);
        return res.status(500).send(`Namespace not saved for ${req.body.namespace}`);
      });
};

const createClusterRole = function(req, res) {
  const values = {ROLE_NAME: JSON.parse(req.body.clusterrole), RULES: JSON.parse(req.body.rules)};
  const template = `${TEMPLATE_PATH}clusterrole.tpl`;
  let repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/cluster`;
  repolocation = `${repolocation}/${JSON.parse(req.body.clusterrole)}.yaml`;

  compileTemplateToRepo(template, values, repolocation)
      .then((result) => {
        return res.status(200).send(`Cluster role saved: ${result}`);
      })
      .catch((err) => {
        console.log(`Clusterrole not saved: ${err}`);
        return res.status(500).send(`Clusterrole not saved for role ${req.body.clusterrole}`);
      });
};

const compileTemplateToRepo = function(template, values, repolocation) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`${template}--${repolocation}`);
      const tpl = fs.readFileSync(template, 'utf8');
      const tplCompiled = handlebars.compile(tpl);
      const result = await tplCompiled(values);
      console.log(result);
      fs.writeFileSync(repolocation, result);
      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  });
};

const deleteFile = function(req, res) {
  try {
    fs.unlinkSync(req.body.filename);
    const msg = `Deleted file ${JSON.stringify(req.body.filename)}`;
    console.log(msg);
    res.status(200).send(msg);
  } catch (err) {
    const msg = `File ${JSON.stringify(req.body.filename)} could not be deleted`;
    console.log(msg);
    res.status(500).send(msg);
  }
};

const showFileContent = function(req, res) {
  try {
    const filecontent = fs.readFileSync(req.body.filepath, 'utf8');
    console.log(filecontent);
    res.status(200).send(filecontent);
  } catch (err) {
    const msg = `File content for ${req.body.fpath} not read: ${err}`;
    console.log(msg);
    res.status(500).send(`File content for ${req.body.fpath} not read`);
  }
};

module.exports = {
  saveAnthosConfig: saveAnthosConfig,
  saveGitRepo: saveGitRepo,
  listGitRepos: listGitRepos,
  labelCluster: labelCluster,
  createClusterRole: createClusterRole,
  deleteFile: deleteFile,
  createNamespace: createNamespace,
  showFileContent: showFileContent,
};
