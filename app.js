var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var connectDB = require('./config/utils/mongoDB')

//auth
var indexRouter = require('./routes/index');
var getUser = require('./routes/auth/getUsers');
var addUser = require ('./routes/auth/addUser');
var updatedUser = require('./routes/auth/updateUser');
var deleteUser = require ('./routes/auth/deleteUser')
var getUserWithName = require('./routes/auth/getUserWithName')


//Data
var getLaundryData = require('./routes/LaundryData/getLaundryData')
var getLaundryDataByAggregation = require('./routes/LaundryData/getLaundryDataByAggregation')

//new 
var newRouter = require('./routes/new')

var app = express();
connectDB.connectDB()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//require('dotenv').config(); // .env dosyasını yükler



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Auth
app.use('/', indexRouter);
app.use('/', getUser);
app.use('/',newRouter);
app.use('/',addUser);
app.use('/',updatedUser);
app.use('/',deleteUser);
app.use('/',getUserWithName);

//Data
app.use('/',getLaundryData);
app.use('/',getLaundryDataByAggregation);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
