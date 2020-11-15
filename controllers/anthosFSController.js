/* eslint-disable no-tabs */
/* eslint-disable max-len */
const simpleGit = require('simple-git');
const {spawn} = require('child_process');
const fs = require('fs');
const config = require('config');
const git = simpleGit('/home/skamalj/anthosui/.repos', {binary: 'git'});
const handlebars = require('handlebars');
const util = require('util');
const yaml = require('yaml');
const readFilePromise = util.promisify(fs.readFile);

// Configurations are set in /config app directory in default.json
const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');
const KUBE_CONFIG_BASEPATH = config.get('KUBE_CONFIG_BASEPATH');
const GIT_CONFIG_BASEPATH = config.get('GIT_CONFIG_BASEPATH');
const SSH_CONFIG_FILE = config.get('SSH_CONFIG_FILE');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');

// Convert request objects to JSON strings for creating template results
handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

// Create kubeconfig file. One file per cluster is created and clustername is filename.
const saveAnthosConfig = async function(req, res) {
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

//  This functions saves the GIT configuration as well as updates SSH config for the repository
//  Function also initializes the repo for Anthos using 'nomos' command
//  and pushes the intial changes to  remote
const saveGitRepo = async function(req, res) {
  saveFile(req, req.body.repoName, GIT_CONFIG_BASEPATH)
      .then((filepath) => updateSSHConfig(req, filepath))
      .then(() => initializeGitRepo(req))
      .then(() => syncGitRepo(`${GIT_REPO_BASEPATH}${req.body.repoName}`))
      .then(() => saveRepoDetails(req))
      .then(() => res.status(200).send(`Repository ${req.body.repoName} saved and initialized`))
      .catch((err) => {
        console.log(`Repository could not created or synced ${err}`);
        return res.status(500).send('Repository could not created or synced');
      });
};

// Function saves the file uploaded from frontend. Example of file uploads are SSH key for repository
const saveFile = async function(req, filename, location) {
  return new Promise(async (resolve, reject) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('Nothing to save: No files were uploaded');
      reject(new Error('No file was uploaded.'));
    }
    // Get the key defined in frontend for file upload, this has no relation to filename
    fileKey = (Object.keys(req.files))[0];
    const tempFile = req.files[fileKey];
    // Use the mv() method to place the file on your server
    await tempFile.mv(`${location}${filename}`, function(err) {
      if (err) {
        console.log(`Unable to save file ${filename}: ${err}`);
        reject(new Error(`Unable to save file ${filename}`));
      }
      console.log(`Uploaded file was saved to ${location}${filename}`);
      resolve(`${location}${filename}`);
    });
  });
};

// Creates and entry in .ssh/config in following format to enable git operations via SSH
// Below "test-7" is <repoName> in the application and is used for anthos configuration
/* Host test7-source.developers.google.com
    	HostName source.developers.google.com
      IdentityFile /home/skamalj/anthosui/.config/git/test7
      StrictHostKeyChecking no
*/
const updateSSHConfig = async function(req, filepath) {
  const re = new RegExp('@([^@]*):');
  const hostname = req.body.repo.match(re)[1];
  const host = `${req.body.repoName}-${hostname}`;
  const stricthostchecking = 'StrictHostKeyChecking no';
  const sshConfig = `Host ${host}\n\tHostName ${hostname}\n\tIdentityFile ${filepath}\n\t${stricthostchecking}\n`;

  return new Promise((resolve, reject) => {
    fs.appendFile(SSH_CONFIG_FILE, sshConfig, (err) => {
      if (err) {
        console.log(`Could not update SSH Config for repo ${req.body.repoName}: ${err}`);
        reject(new Error(`Could not update SSH Config`));
      } else {
        console.log(`SSH Config updated for repo ${req.body.repoName}`);
        resolve();
      }
    });
  });
};

// Clones the repository to local data directory and initializes it if empty/requested
// This function does not push the code, that is written separately.
const initializeGitRepo = async function(req) {
  const processCwd = `${GIT_REPO_BASEPATH}${req.body.repoName}`;

  const re = new RegExp('@([^@]*):');
  const hostname = req.body.repo.match(re)[1];
  const host = `${req.body.repoName}-${hostname}`;
  const gitrepo = req.body.repo.replace(hostname, host);

  return new Promise(async (resolve, reject) => {
    await git.cwd(GIT_REPO_BASEPATH).clone(gitrepo, req.body.repoName)
        .then(() => {
          console.log(`Going to execute nomos: ${req.body.doNotInitializeRepo == 'false'}`);
          if (req.body.doNotInitializeRepo == 'false') {
            const pwd = spawn('nomos init --force', {detached: true, shell: true, cwd: processCwd});
            pwd.stdout.on('data', (data) => {
              console.log(`nomos stdout: ${data}`);
            });
            pwd.stderr.on('data', (data) => {
              console.error(`nomos stderr: ${data}`);
            });
            pwd.on('close', (code) => {
              console.log(`Nomos initalization exited with code ${code}`);
              if (code != 0) {
                reject(new Error('Cannot initialize repository with nomos'));
              } else {
                resolve();
              }
            });
          } else {
            resolve();
          }
        })
        .catch((err) => reject(err));
  });
};

// Commit and push the changes
const syncGitRepo = async function(repoPath) {
  return new Promise((resolve, reject) => {
    git.cwd(repoPath)
        .add('./*')
        .commit('Push by Anthos Accelerator')
        .push()
        .exec(() => resolve())
        .catch((err) => reject(err));
  });
};

// Function saves/stores details of all git repos configured in the system.
// This is one place from where all details for repositories can be queried,
// otherwiese we will need to parse repositrory folders and their remotes for information.
const saveRepoDetails = async function(req) {
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
        fs.writeFileSync(`${GIT_CONFIG_BASEPATH}gitrepos.config`, JSON.stringify(gitrepos));
        resolve();
      });
    } catch (err) {
      console.log(`New Repo ${repoName} not persisted to config: ${JSON.stringify(gitrepos)}`);
      reject(err);
    }
  });
};

// List git repos. Function needs to be update to get information from
// gitconfig file craeted at initialization
const listGitRepos = async function(req, res) {
  readFilePromise(`${GIT_CONFIG_BASEPATH}gitrepos.config`, 'utf-8')
      .then((data) => {
        const repolist = (JSON.parse(data))['repos'].map((repo) => {
          return {'name': repo.repoName, 'repouri': repo.repo};
        });
        console.log(`Repolist generated: ${JSON.stringify(repolist)}`);
        return res.status(200).send(repolist);
      })
      .catch((err) => {
        console.log(`Repolist could not be generated: ${err}`);
        return res.status(500).send('Repolist could not be generated');
      });
};

// Main handlebars function to create YAML manifests using values
// send from frontend and handlebars templates
const compileTemplateToRepo = async function(template, values, repolocation) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Building manifest using template  ${template} with values ${JSON.stringify(values)}`);
      const tpl = fs.readFileSync(template, 'utf8');
      const tplCompiled = handlebars.compile(tpl);
      const result = await tplCompiled(values);
      fs.writeFileSync(repolocation, result);
      console.log(`Template result\n============\n${result}\n============\nsaved to ${repolocation}`);
      return resolve(result);
    } catch (err) {
      console.log(`Not able to compile template: ${err}`);
      return reject(err);
    }
  });
};

// Delete file from selected repository
const deleteFile = async function(req, res) {
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

// Delete directory from selected repository
const deleteDir = async function(req, res) {
  try {
    fs.rmdirSync(req.body.dirname);
    const msg = `Deleted directory ${JSON.stringify(req.body.dirname)}`;
    console.log(msg);
    res.status(200).send(msg);
  } catch (err) {
    const msg = `Directory/Namespace ${JSON.stringify(req.body.dirname)} could not be deleted`;
    console.log(`${msg}: ${err}`);
    res.status(500).send(msg);
  }
};

// Reads the file and sends the content to frontend for display
const showFileContent = async function(req, res) {
  try {
    const filecontent = fs.readFileSync(req.body.filepath, 'utf8');
    console.log(`File content sent for ${req.body.filepath}`);
    res.status(200).send(filecontent);
  } catch (err) {
    const msg = `File content for ${req.body.fpath} not read: ${err}`;
    console.log(msg);
    res.status(500).send(`File content for ${req.body.fpath} not read`);
  }
};

// Executes git pull-push on request from frontend
const execSyncRepo = async function(req, res) {
  syncGitRepo(`${GIT_REPO_BASEPATH}${req.body.repoName}`)
      .then(() => res.status(200).send(`Repository ${req.body.repoName} synced`))
      .catch((err) => {
        console.log(`Repository could not synced ${err}`);
        res.status(500).send('Repository could not be synced');
      });
};

const getObjectYaml = function(fpath) {
  try {
    const yamlfile = fs.readFileSync(fpath, 'utf8');
    return yaml.parse(yamlfile);
  } catch (err) {
    console.log(`Can not read object from  yaml file ${fpath}: ${err}`);
    return null;
  }
};

module.exports = {
  saveAnthosConfig: saveAnthosConfig,
  saveGitRepo: saveGitRepo,
  listGitRepos: listGitRepos,
  deleteFile: deleteFile,
  saveFile: saveFile,
  showFileContent: showFileContent,
  compileTemplateToRepo: compileTemplateToRepo,
  deleteDir: deleteDir,
  execSyncRepo: execSyncRepo,
  getObjectYaml: getObjectYaml,
};
