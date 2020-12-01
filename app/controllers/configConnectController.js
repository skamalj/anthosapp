/* eslint-disable max-len */

const fs = require('fs');
const config = require('config');
const GIT_REPO_BASEPATH = `${config.get('DATA_PATH')}/.repos/`;
const TEMPLATE_PATH = `${config.get('BASE_PATH')}/templates/`;
const {compileTemplateToRepo} = require('./anthosFSController');

// Create namespace object in requested repository. It creates a directory with NS name
// and then places a namespace YAML in that directory. If nammespace is Abstract, then
// only directory is created.
const onboardProject = async function(req, res) {
  console.log(JSON.stringify(req.body));
  const values = {PROJECT_ID: req.body.projectid};
  const template = `${TEMPLATE_PATH}CONNECT/project.tpl`;

  let repolocation = `${GIT_REPO_BASEPATH }${req.body.repoName}/namespaces/cnrm/${req.body.projectid}`;

  try {
      fs.mkdirSync(repolocation, {recursive: true, mode: fs.constants.S_IRWXU});
  } catch (err) {
    console.log(`Project not onboarded: ${err}`);
    return res.status(500).send(`Project ${values.PROJECT_ID} not onboarded`);
  }

  compileTemplateToRepo(template, values, `${repolocation}/${req.body.projectid}.yaml`)
      .then((result) => {
        console.log(`Project onboarded: ${result}`);
        res.status(200).send(`Project ${values.PROJECT_ID} onboarded`);
      })
      .catch((err) => {
        console.log(`Project not onboarded: ${err}`);
        res.status(500).send(`Project ${values.PROJECT_ID} not onboarded`);
      });
};



module.exports = {
  onboardProject: onboardProject,
};
