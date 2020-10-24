/* eslint-disable max-len */

const fs = require('fs');
const config = require('config');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');
const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');
const anthosfs = require('./anthosFSController');


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

module.exports = {
  createNamespace: createNamespace,
  listEmptyNS: listEmptyNS,
  createEmptyNSList, createEmptyNSList,
};
