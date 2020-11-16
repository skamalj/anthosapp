/* eslint-disable max-len */
const config = require('config');
const {compileTemplateToRepo} = require('./anthosFSController');

const GIT_REPO_BASEPATH = config.get('GIT_REPO_BASEPATH');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');

// Get parameter values from request object for a particulat policy
const getValuesForPolicy = function(policy, path) {
  try {
    const policyType = policy.type;
    const policyName = policy.name;
    const template = `${TEMPLATE_PATH}OPA/${policyType}.tpl`;
    const location = `${path}/${policyName}-${policyType}.yaml`;

    policy.apigroup = policy.apigroup == '' ? policy.apigroup : ',' + policy.apigroup;
    let values = {};

    if (policyType == 'K8sContainerLimits') {
      values = {POLICY_NAME: policyName, CLUSTER_SELECTOR: policy.clusterselector,
        API_GROUPS: policy.apigroup.split(','), KIND: policy.kind.split(','),
        MEMORY_LIMIT: policy.memorylimit, CPU_LIMIT: policy.cpulimit};
    } else if (policyType == 'K8sRequiredLabels') {
      values = {POLICY_NAME: policyName, CLUSTER_SELECTOR: policy.clusterselector,
        API_GROUPS: policy.apigroup.split(','), KIND: policy.kind.split(','),
        LABEL_KEY: policy.labelkey, LABEL_REGEX: policy.labelregex};
    }

    return {template, values, location};
  } catch (err) {
    console.log(`Cannot parse policy object ${JSON.stringify(policy)}: ${err}`);
    return null;
  }
};

// Create manifest to attach labels to cluster
const createGeneralOPAPolicies = async function(req, res) {
  const repolocation = `${GIT_REPO_BASEPATH }${JSON.parse(req.body.repoName)}/cluster`;
  const clusterselector = JSON.parse(req.body.clusterselector);

  const policyList = JSON.parse(req.body.policylist);
  const policypromises = policyList.map((policy) => {
    policy.clusterselector = clusterselector;
    const policydata = getValuesForPolicy(policy, repolocation);
    if (policydata) {
      console.log(JSON.stringify(policydata));
      return compileTemplateToRepo(policydata.template, policydata.values, policydata.location);
    } else {
      return null;
    }
  });
  Promise.allSettled(policypromises)
      .then((result) => {
        const responce = result.map((r, i) => {
          if (r.status == 'rejected') {
            console.log(`Policy ${policyList[i].name} not created: ${r.reason}`);
            return `Policy ${policyList[i].name} not created`;
          } else {
            console.log(`Policy ${policyList[i].name} created: ${r.value}`);
            return `Policy ${policyList[i].name} created`;
          }
        });
        res.status(200).send(responce);
      })
      .catch((err) => {
        console.log(`Policies could not be saved: ${err}`);
        res.status(500).send(`Policies could not be saved`);
      });
};


module.exports = {
  createGeneralOPAPolicies: createGeneralOPAPolicies,
};
