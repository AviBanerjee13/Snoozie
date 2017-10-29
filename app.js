var restify = require('restify');
var builder = require('botbuilder');

var introMsg = 'Please answer the following questions below to determine if your patient runs a risk of Sleep Apnea';

var question_1 = 'Patient snores loudly (loud enough to be heard through closed doors or your bed-partner elbows you for snoring at night)?';
var question_2 = 'Patient often feel Tired, Fatigued, or Sleepy during the daytime (such as falling asleep during driving or talking to someone)?';
var question_3 = 'Has anyone observed the patient Stop Breathing or Choking/Gasping during your sleep ?';
var question_4 = 'Patient being treated for High Blood Pressure ?';
var question_5 = 'Body Mass Index more than 35 kg/m2?';
var question_6 = 'Age older than 50 ?';
var question_7 = 'Gender = Male ?';
var question_8_M = 'Shirt collar 17 inches / 43cm or larger?'
var question_8_F = 'Shirt collar 16 inches / 41cm or larger?'

var highRisk = 'Your patient is at High Risk of having Sleep Apnea. Please refer Sleep Study.';
var intermediateRisk = 'Your patient is at Intermediate Risk of having Sleep Apnea. Consider Sleep Study/Continue to monitor.';
var lowRisk = 'Your patient is at Low Risk of having Sleep Apnea. No Sleep Study required.';

var fareWell = [
    'Keep up the great work! Adios.',
    'See ya later!',
    'Nice talking to you!'
];

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: '',//process.env.MICROSOFT_APP_ID,
    appPassword: ''//process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [
    function (session, results) {
        session.beginDialog('askForName');
    },
    function (session, results) {
        session.dialogData.userName = results.response;
        session.send('Hello %s! ' + introMsg, results.response);
        session.dialogData.STOP = 0;
        session.dialogData.BANG = 0;
        session.beginDialog('question_1');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.STOP++;
        }
        session.beginDialog('question_2');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.STOP++;
        }
        session.beginDialog('question_3');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.STOP++;
        }
        session.beginDialog('question_4');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.STOP++;
        }
        session.beginDialog('question_5');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.BMI = results.response.entity;
            session.dialogData.BANG++;
        }
        session.beginDialog('question_6');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.BANG++;
        }
        session.beginDialog('question_7');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            session.dialogData.genderMale = results.response.entity;
            session.dialogData.BANG++;
            session.beginDialog('question_8_M')
        } else {
            session.beginDialog('question_8_F')
        }
    },
    function (session, results) {
        session.dialogData.neckCircumferenceFemale = results.response.entity;
        session.send(riskFactor(session));
        var randomNumber = Math.floor(Math.random() * fareWell.length);
        session.send(fareWell[randomNumber]);
        session.endDialog();
    }
]);

var riskFactor = function (session) {
    var total = session.dialogData.STOP + session.dialogData.BANG;

    if (session.dialogData.STOP >= 2) {
        if (session.dialogData.genderMale === 'yes') {
            return highRisk;
        } else if (session.dialogData.BMI === 'yes') {
            return highRisk;
        } else if (session.dialogData.neckCircumferenceFemale === 'yes') {
            return highRisk;
        }
    }
    if (total >= 5) {
        return highRisk;
    } else if (total >= 3) {
        return intermediateRisk;
    }

    return lowRisk;
};

bot.dialog('askForName', [
    function (session) {
        builder.Prompts.text(session, "Hi! What is your name?");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

// Dialog to ask for number of people in the party
bot.dialog('question_1', [
    function (session) {
        builder.Prompts.choice(session, question_1, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

bot.dialog('question_2', [
    function (session) {
        builder.Prompts.choice(session, question_2, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

bot.dialog('question_3', [
    function (session) {
        builder.Prompts.choice(session, question_3, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

bot.dialog('question_4', [
    function (session) {
        builder.Prompts.choice(session, question_4, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

bot.dialog('question_5', [
    function (session) {
        builder.Prompts.choice(session, question_5, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

bot.dialog('question_6', [
    function (session) {
        builder.Prompts.choice(session, question_6, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

bot.dialog('question_7', [
    function (session) {
        builder.Prompts.choice(session, question_7, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

// Neck Circumference of Male
bot.dialog('question_8_M', [
    function (session) {
        builder.Prompts.choice(session, question_8_M, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])

// Neck Circumference of Female
bot.dialog('question_8_F', [
    function (session) {
        builder.Prompts.choice(session, question_8_F, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])