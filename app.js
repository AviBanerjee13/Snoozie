var restify = require('restify');
var builder = require('botbuilder');
var googleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');

var introMsg = 'Please answer the following questions below to determine if your patient is at risk of Sleep Apnea';

var question_1 = 'Does your patient snores loudly?';
var question_2 = 'Do they often feel Tired, Fatigued, or Sleepy during the daytime?';
var question_3 = 'Has anyone observed the patient Stop Breathing or Choking/Gasping during your sleep?';
var question_4 = 'Is the patient being treated for High Blood Pressure?';
var question_5 = 'Is the Body Mass Index more than 35 kg/m2?';
var question_6 = 'Age older than 50 ?';
var question_7 = 'Gender = Male ?';
var question_8_M = 'Shirt collar 17 inches / 43cm or larger?';
var question_8_F = 'Shirt collar 16 inches / 41cm or larger?';
var question_9 = 'Is your patient being treated for OSA and/or have they already been referred?';

var highRisk = 'Your patient is at High Risk of having Sleep Apnea. Please refer Sleep Study.';
var intermediateRisk = 'Your patient is at Intermediate Risk of having Sleep Apnea. Consider Sleep Study/Continue to monitor.';
var lowRisk = 'Your patient is at Low Risk of having Sleep Apnea. No Sleep Study required.';

var fareWell = [
    'Keep up the great work!',
    'See ya later!',
    'Nice talking to you!'
];

var yes = 'yes';
var no = 'no';

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// '17z06lj2jYWKlyryemhN7Z4bnr8huAqKAj1RZTH1vrWM'
var doc = new googleSpreadsheet('17z06lj2jYWKlyryemhN7Z4bnr8huAqKAj1RZTH1vrWM');
var row = {};

// Get the EST as the first element in the sheet
row.CreatedDateTime = function () {
    offset = -4.0
    clientDate = new Date();
    utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);
    serverDate = new Date(utc + (3600000 * offset));
    return serverDate.toLocaleString();
}();

var bot = new builder.UniversalBot(connector, [
    function (session, results) {
        session.beginDialog('askForName');
    },
    function (session, results) {
        session.dialogData.userName = results.response;
        row.Provider = results.response;
        session.send('Hello %s! ' + introMsg, results.response);
        session.dialogData.STOP = 0;
        session.dialogData.BANG = 0;
        session.beginDialog('question_1');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.Snoring = yes;
            session.dialogData.STOP++;
        } else {
            row.Snoring = no;
        }
        session.beginDialog('question_2');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.Tired = yes;
            session.dialogData.STOP++;
        } else {
            row.Tired = no;
        }
        session.beginDialog('question_3');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.StopBreathing = yes;
            session.dialogData.STOP++;
        } else {
            row.StopBreathing = no;
        }
        session.beginDialog('question_4');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.HighBloodPressure = yes;
            session.dialogData.STOP++;
        } else {
            row.HighBloodPressure = no;
        }
        session.beginDialog('question_5');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.BMIGreaterThan35 = yes;
            session.dialogData.BMI = results.response.entity;
            session.dialogData.BANG++;
        } else {
            row.BMIGreaterThan35 = no;
        }
        session.beginDialog('question_6');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.AgeGreaterThan50 = yes
            session.dialogData.BANG++;
        } else {
            row.AgeGreaterThan50 = no;
        }
        session.beginDialog('question_7');
    },
    function (session, results) {
        if (results.response.entity === 'yes') {
            row.Male = yes;
            session.dialogData.genderMale = results.response.entity;
            session.dialogData.BANG++;
            session.beginDialog('question_8_M')
        } else {
            row.Male = no;
            session.beginDialog('question_8_F')
        }
    },
    function (session, results) {
        if (row.Male === yes) {
            row.NeckGreaterThan17inOr43cm = results.response.entity;
        } else {
            row.NeckGreaterThan16inOr41cm = results.response.entity;
        }

        session.dialogData.neckCircumferenceFemale = results.response.entity;
        session.beginDialog('question_9')
    },
    function (session, results) {
        row.IsBeingTreatedOrReferred = results.response.entity;
        var risk = riskFactor(session);

        if(risk === lowRisk){
            row.Risk = "LOW";    
        } else if(risk === intermediateRisk){
            row.Risk = "INTERMEDIATE";
        } else {
            row.Risk = "HIGH";
        }

        session.send(risk);
        var randomNumber = Math.floor(Math.random() * fareWell.length);
        session.send(fareWell[randomNumber]);
        addToSpreadsheet(row);
        session.endDialog();
    }
]);

var addToSpreadsheet = function (row) {
    // Authenticate with the Google Spreadsheets API.
    doc.useServiceAccountAuth(creds, function (err) {
        doc.addRow(1, row, function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
};

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

// Previously treated
bot.dialog('question_9', [
    function (session) {
        builder.Prompts.choice(session, question_9, "yes|no");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
])
