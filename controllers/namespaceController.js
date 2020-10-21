/* eslint-disable max-len */

const fs = require('fs');
const config = require('config');
const TEMPLATE_PATH = config.get('TEMPLATE_PATH');
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

module.exports = {
  createNamespace: createNamespace,
};
