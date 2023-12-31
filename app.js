var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var cors = require("cors");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var movieAdminRouter = require("./routes/movieAdmin");
var actorRouter = require("./routes/actor");
var producerRouter = require("./routes/producer");
const {dbUrl} = require("./dbConfig");
const { mongoose } = require("mongoose");

console.log(dbUrl)
mongoose.connect(dbUrl, { useNewUrlParser: true,useUnifiedTopology: true}  )
.then(
  (res) =>  {
    console.log(`Database is Connected`)
  },
  err => { console.log(err) }
);

var logger = require("morgan");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) =>
  res.send(`Server Running`)
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/movieAdmin", movieAdminRouter);
app.use("/actor", actorRouter);
app.use("/producer", producerRouter);


app.use(express.urlencoded({extended:false}))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
