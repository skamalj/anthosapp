/* eslint-disable max-len */
/* eslint-disable no-tabs */
const fs = require('fs');
const config = require('config');

const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');


const repoTree = function(req, res) {
  readDirTreeAsync(`${GIT_REPO_BASEPATH}${req.body.repoName}/`)
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

const readDirTreeAsync = function(dirpath) {
  return new Promise( async (resolve, reject) => {
    try {
      const tree = await readDirTree(dirpath);
      return resolve(tree);
    } catch (err) {
      console.log(`Unable to read directory tree at path: ${dirpath}: ${err}`);
      return reject(err);
    }
  });
};
const readDirTree = async function(dirpath) {
  const tree = {files: []};
  const dirents = fs.readdirSync(dirpath, {withFileTypes: true});
  for (const d of dirents) {
    if (d.isDirectory()) {
      const files = await readDirTree(`${dirpath}${d.name}/`);
      tree.files.push({
        name: d.name, type: 'folder', path: `${dirpath}${d.name}/`, tree: files,
      });
    } else {
      tree.files.push({
        name: d.name, type: 'file', path: `${dirpath}${d.name}`,
      });
    }
  }
  return tree;
};

module.exports = {
  repoTree: repoTree,
  readDirTree: readDirTree,
};
