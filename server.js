const dboperations = require('./dboperations');
var personnel = require('./personnel');

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: '*'
}));
app.use('/api', router);

router.use((request, response, next) => {
    //write authen here
    console.log('middleware');
    next();
});

router.route('/login').post((request, response) => {

    let personnel = { ...request.body }
    dboperations.login(personnel).then(result => {
        response.json(result);
    }).catch(err => {
        console.error(err);
        response.sendStatus(500);
    });

});

router.route('/authen').post((request, response) => {

    const token = request.headers.authorization.split(' ')[1];
    dboperations.authen(token).then(result => {
        response.json(result);
    }).catch(err => {
        console.error(err);
        response.sendStatus(500);
    });

});

var port = process.env.PORT;
app.listen(port);
console.log('personnel API is running at ' + port);