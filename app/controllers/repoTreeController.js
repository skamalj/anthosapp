/* eslint-disable max-len */
/* eslint-disable no-tabs */
const fs = require('fs');
const config = require('config');

const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');

// Handler for dirtree request from frontend.
const repoTree = async function(req, res) {
  const hidenamespace = req.body.hidenamespace == 'true'? true : false;
  readDirTreeAsync(`${GIT_REPO_BASEPATH}${req.body.repoName}/`, hidenamespace)
      .then((tree) => {
        const repotree = {
          name: 'head', type: 'folder', path: `${GIT_REPO_BASEPATH}${req.body.repoName}/`,
          tree: tree,
        };
        res.status(200).send(JSON.stringify(repotree));
      })
      .catch((err) => {
        console.log(`Unable to fetch tree structure for repo ${req.body.repoName}: ${err}`);
        res.status(500).send('Not able to get repository tree, check backend');
      });
};

// Makes readDirTree function async by returning a Promise.
const readDirTreeAsync = async function(dirpath, hidenamespace) {
  return new Promise( async (resolve, reject) => {
    try {
      const tree = await readDirTree(dirpath, hidenamespace);
      return resolve(tree);
    } catch (err) {
      console.log(`Unable to read directory tree at path: ${dirpath}: ${err}`);
      return reject(err);
    }
  });
};

// Recursively creates directory tree from base path passed into this function. This function
// provides input to tree vueObject on the frontend.
const readDirTree = async function(dirpath, hidenamespace) {
  const tree = {files: []};
  const dirents = fs.readdirSync(dirpath, {withFileTypes: true});
  for (const d of dirents) {
    if (!d.name.startsWith('.')) {
      if ((`${dirpath}${d.name}`.indexOf('namespace') == -1 && hidenamespace) ||
      (`${dirpath}${d.name}`.indexOf('namespaces') !== -1 && !hidenamespace) ) {
        if (d.isDirectory()) {
          const files = await readDirTree(`${dirpath}${d.name}/`, hidenamespace);
          tree.files.push({
            name: d.name, type: 'folder', path: `${dirpath}${d.name}/`, tree: files,
          });
        } else {
          tree.files.push({
            name: d.name, type: 'file', path: `${dirpath}${d.name}`,
          });
        }
      }
    }
  }
  return tree;
};

module.exports = {
  repoTree: repoTree,
  readDirTree: readDirTree,
};
