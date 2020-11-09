/* eslint-disable max-len */
const config = require('config');
const fs = require('fs');
const {compileTemplateToRepo} = require('./anthosFSController');

const TEMPLATE_PATH = config.get('TEMPLATE_PATH');
const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');

// Setup Sysdig - configures access code and clusterselector
const setupSysdig = async function(req, res) {
  console.log(JSON.stringify(req.body));
  const dirents = fs.readdirSync(`${TEMPLATE_PATH}SYSDIG/`, {withFileTypes: true});
  const values = {CLUSTER_SELECTOR: req.body.clusterselector,
    ACCESS_KEY: Buffer.from(req.body.access_key).toString('base64')};
  const nscontext = req.body.nscontext;
  const sysdigpromises = dirents.map((d) => {
    let location ='';
    if (d.name.includes('clusterrole')) {
      location = `${GIT_REPO_BASEPATH }${req.body.repoName}/cluster/${values.CLUSTER_SELECTOR}-${d.name}`;
    } else {
      location = `${nscontext}${values.CLUSTER_SELECTOR}-${d.name}`;
    }
    // Get namespace value to be used in configmap
    values.NAMESPACE = nscontext.split('/').slice(-2)[0];
    compileTemplateToRepo(`${TEMPLATE_PATH}SYSDIG/${d.name}`, values, location);
  });
  Promise.allSettled(sysdigpromises)
      .then((result) => {
        let msg = 'Sysdig configured to repo, now sync it to clusters';
        result.map((r) => {
          if (r.status == 'rejected') {
            console.log(`Sysdig: ${r.status} ${r.reason}`);
            return msg = 'Sysdig not saved';
          } else {
            console.log(`Sysdig: ${r.status}`);
          }
        });
        res.status(200).send(msg);
      })
      .catch((err) => {
        console.log(`Sysdig not configured : ${err}`);
        res.status(500).send(`Sysdig not configured`);
      });
};


module.exports = {
  setupSysdig: setupSysdig,
};