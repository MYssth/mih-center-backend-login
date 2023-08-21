const dboperations = require("./dboperations");
var personnel = require("./personnel");

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const { request, response } = require("express");
var app = express();
var router = express.Router();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api/auth", router);

router.use((request, response, next) => {
  //write authen here

  response.setHeader("Access-Control-Allow-Origin", "*");
//   console.log("middleware");
  next();
});

router.route("/health").get((request, response) => {
    // console.log("health check");
  response.json({ status: 200 });
});

router.route("/login").post((request, response) => {
  let psn = { ...request.body };
  dboperations
    .login(psn)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/authen").post((request, response) => {
  const token = request.headers.authorization.split(" ")[1];
  dboperations
    .authen(token)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/verify/:id/:secret").get((request, response) => {
  dboperations
    .verify(request.params.id, request.params.secret)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

router.route("/secretchg").post((request, response) => {
  const token = request.headers.authorization.split(" ")[1];
  let psn = { ...request.body };
  dboperations
    .secretChg(psn, token)
    .then((result) => {
      response.json(result);
    })
    .catch((err) => {
      console.error(err);
      response.sendStatus(500);
    });
});

var port = process.env.PORT;
app.listen(port);
console.log("personnel API is running at " + port);
