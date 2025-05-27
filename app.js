var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var connectDB = require('./config/utils/mongoDB')
const firebaseAdmin = require('./config/utils/firebase')
const SchedulerService = require('./config/utils/schedulerService');

//auth
var sendPasswordResetCode = require('./routes/auth/sendPasswordResetCode')
var indexRouter = require('./routes/index');
var policy = require('./routes/policy')
var getUser = require('./routes/auth/getUsers');
var addUser = require ('./routes/auth/addUser');
var updatedUser = require('./routes/auth/updateUser');
var deleteUser = require ('./routes/auth/deleteUser')
var getUserWithName = require('./routes/auth/getUserWithEmail')
var login = require('./routes/auth/login')
var logout  = require ('./routes/auth/logout')
var verifyPasswordResetCode = require('./routes/auth/verifyPasswordResetCode')
var refreshPassword = require('./routes/auth/refreshPasssword')
var googleAuth = require('./routes/auth/googleAuth')
var refreshToken = require('./routes/auth/refreshToken')

// Stories
var getAllStory = require('./routes/Story/getAllStory')
var getFreeStories = require('./routes/Story/getFreeStories')
var getCategories = require('./routes/Story/getCategories')
var addCategory = require('./routes/Story/addCategory')
var insertStory = require('./routes/Story/insertStory')
var updateStory = require('./routes/Story/updateStory')
var getUpdatedStories = require('./routes/Story/getUpdatedStories')

//Subscription
var verifySubscription = require('./routes/Subscription/verifySubscription')
var subscriptionStatus = require('./routes/Subscription/subscriptionStatus')
var subscriptionWebhook = require('./routes/Subscription/subscriptionWebhook')

//FCMFirebase
var updatedFcmToken = require('./routes/FCMFirebase/updateFcmToken')

//Voice
var generate = require('./routes/GenerateVoice/generate')
var workPlace = require('./routes/GenerateVoice/voices/workPlace')
var generateBatchAudio = require('./routes/GenerateVoice/generateBatchAudio')

var poly = require('./routes/GenerateVoice/poly')

//SpecialContent
var getSpecialDay = require('./routes/SpecialContent/getSpecialContent')
var addSpecialDay = require('./routes/SpecialContent/addSpecialDay')

//compressAudio
var compressAudio = require('./routes/GenerateVoice/compressAudio')

//attribution
var attribution = require('./routes/attribution/attribution')
var getAttributions = require('./routes/attribution/getAttribution')


//new 
var newRouter = require('./routes/new');
const { insertMany } = require('./config/models/blackListedTokenModel');

var app = express();
connectDB.connectDB()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//require('dotenv').config(); // .env dosyasını yükler



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/privacy-policy', express.static(path.join(__dirname, 'views/privacy-policy')));


// Scheduler'ı başlat
try {
  new SchedulerService();
  console.log('🚀 Notification scheduler started successfully');
} catch (error) {
  console.error('🚨 Failed to start notification scheduler:', error);
}


//Auth
app.use('/', policy);
app.use('/', indexRouter);
app.use('/', getUser);
app.use('/',newRouter);
app.use('/',addUser);
app.use('/',updatedUser);
app.use('/',deleteUser);
app.use('/',getUserWithName);
app.use('/',login)
app.use('/',logout)
app.use('/',sendPasswordResetCode)
app.use('/',verifyPasswordResetCode)
app.use('/',refreshPassword)
app.use('/',googleAuth)
app.use('/',getUpdatedStories)
app.use('/',addCategory)
app.use('/',refreshToken)

//Stories
app.use('/',getAllStory);
app.use('/',getFreeStories)
app.use('/',getCategories)
app.use('/',insertStory)
app.use('/',updateStory)

//Subscription
app.use('/',verifySubscription)
app.use('/',subscriptionStatus)
app.use('/',subscriptionWebhook)

//FCMFirebase
app.use('/',updatedFcmToken)

//Voice
app.use('/',generate)
app.use('/',workPlace)
app.use('/',generateBatchAudio)

app.use('/',poly)

//SpecialDay
app.use('/',getSpecialDay)
app.use('/',addSpecialDay)

//compressAudio
app.use('/',compressAudio)

//attribution
app.use('/',attribution)
app.use('/',getAttributions)




// Statik klasör (tarayıcıdan .mp3 erişimi için)
app.use('/voices', express.static(path.join(__dirname, 'voiceRouterFolderName', 'voices')));


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
