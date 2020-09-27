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
          if (!req.body.doNotInitializeRepo) {
            const pwd = spawn('nomos init --force', {detached: true, shell: true, cwd: processCwd});

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


module.exports = {
  saveAnthosConfig: saveAnthosConfig,
  saveGitRepo: saveGitRepo,
};
