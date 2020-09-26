
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

// set up handlebars view engine and express app
const handlebars = require('express-handlebars').create({
  defaultLayout: 'main',
});
const app = express();
app.use(fileUpload());
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use('/components', express.static('./components'));

require('./routes/approutes')(app);

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') +
    '; press Ctrl-C to terminate.');
});


