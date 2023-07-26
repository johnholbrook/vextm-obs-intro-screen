const { QMainWindow, QIcon, QWidget, FlexLayout, QLabel, QLineEdit, QCheckBox, QPlainTextEdit, QPushButton, QSpinBox, QCursor, QScrollBar } = require("@nodegui/nodegui");
const { spawn } = require("child_process");

// create the window
const win = new QMainWindow();
win.setWindowTitle("TM Stream Widgets");
win.resize(400, 480);

// set the window icon
const icon = new QIcon("./icon/icon.ico");
win.setWindowIcon(icon);

// root view
const rootView = new QWidget();
rootView.setObjectName("rootView");
const rootViewLayout = new FlexLayout();
rootView.setLayout(rootViewLayout);

// area for options (server address, password, etc.)
const optionsArea = new QWidget();
const optionsAreaLayout = new FlexLayout();
optionsArea.setObjectName("optionsArea");
optionsArea.setLayout(optionsAreaLayout);

// server address row
const serverAddrRow = new QWidget();
const serverAddrRowLayout = new FlexLayout();
serverAddrRow.setObjectName("serverAddrRow");
serverAddrRow.setLayout(serverAddrRowLayout);

const serverAddrLabel = new QLabel();
serverAddrLabel.setText("TM Server Address:");
serverAddrLabel.setObjectName("serverAddrLabel");
serverAddrRowLayout.addWidget(serverAddrLabel);

const serverAddrInput = new QLineEdit();
serverAddrInput.setObjectName("serverAddrInput");
serverAddrInput.setText("localhost");
serverAddrRowLayout.addWidget(serverAddrInput);

// TM password row
const passRow = new QWidget();
const passRowLayout = new FlexLayout();
passRow.setObjectName("passRow");
passRow.setLayout(passRowLayout);

const passLabel = new QLabel();
passLabel.setText("TM Admin Password:");
passLabel.setObjectName("passLabel");
passRowLayout.addWidget(passLabel);

const passInput = new QLineEdit();
passInput.setObjectName("passInput");
passRowLayout.addWidget(passInput);

// server port row
const portRow = new QWidget();
const portRowLayout = new FlexLayout();
portRow.setObjectName("portRow");
portRow.setLayout(portRowLayout);

const portLabel = new QLabel();
portLabel.setText("Display server port:");
portLabel.setObjectName("portLabel");
portRowLayout.addWidget(portLabel);

const portInput = new QLineEdit();
portInput.setObjectName("portInput");
portInput.setText("8080");
portRowLayout.addWidget(portInput);

// division name row
const divisionRow = new QWidget();
const divisionRowLayout = new FlexLayout();
divisionRow.setObjectName("divisionRow");
divisionRow.setLayout(divisionRowLayout);

const divisionLabel = new QLabel();
divisionLabel.setText("Division:");
divisionLabel.setObjectName("divisionLabel");
divisionRowLayout.addWidget(divisionLabel);

const divisionInput = new QLineEdit();
divisionInput.setObjectName("divisionInput");
divisionInput.setText("division1");
divisionRowLayout.addWidget(divisionInput);

// field set ID row
const fieldSetRow = new QWidget();
const fieldSetRowLayout = new FlexLayout();
fieldSetRow.setObjectName("fieldSetRow");
fieldSetRow.setLayout(fieldSetRowLayout);

const fieldSetLabel = new QLabel();
fieldSetLabel.setText("Field Set ID:");
fieldSetLabel.setObjectName("fieldSetLabel");
fieldSetRowLayout.addWidget(fieldSetLabel);

const fieldSetInput = new QSpinBox();
fieldSetInput.setObjectName("fieldSetInput");
fieldSetInput.setValue(1);
fieldSetRowLayout.addWidget(fieldSetInput);

// checkbox to show match predictions
const predictMatchCheckbox = new QCheckBox();
predictMatchCheckbox.setText("Show match prediction on intro (VRC only)");

// checkbox to shorten team locations
const omitCountryCheckbox = new QCheckBox();
omitCountryCheckbox.setText("Omit country from team location");
omitCountryCheckbox.setChecked(true);

// checkbox to show scouting data
const showStatsCheckbox = new QCheckBox();
showStatsCheckbox.setText("Show team scouting data on intro");
showStatsCheckbox.setChecked(true);

const showFieldCheckbox = new QCheckBox();
showFieldCheckbox.setText("Show field name on intro");
showFieldCheckbox.setChecked(true);

// // checkbox to play VRC sound effects
// const playSoundsCheckbox = new QCheckBox();
// playSoundsCheckbox.setText("Play VRC sound effects from display");

// area to show the output of the server
const serverOutput = new QPlainTextEdit();
// const serverOutput = new QTextEdit();
serverOutput.setObjectName("serverOutput");
serverOutput.setHorizontalScrollBarPolicy(1);
const serverOutputScrollBar = new QScrollBar();
serverOutput.setVerticalScrollBar(serverOutputScrollBar);
// serverOutput.setVerticalScrollBarPolicy(1);
serverOutput.setReadOnly(true);
serverOutput.setWordWrapMode(0);

// Button to start the server
const startButton = new QPushButton();
startButton.setText("Start");
startButton.setObjectName("startButton");

// Add the widgets to their respective layouts
optionsAreaLayout.addWidget(serverAddrRow);
optionsAreaLayout.addWidget(passRow);
optionsAreaLayout.addWidget(portRow);
optionsAreaLayout.addWidget(divisionRow);
optionsAreaLayout.addWidget(fieldSetRow);
optionsAreaLayout.addWidget(predictMatchCheckbox);
// optionsAreaLayout.addWidget(playSoundsCheckbox);
optionsAreaLayout.addWidget(omitCountryCheckbox);
optionsAreaLayout.addWidget(showStatsCheckbox);
optionsAreaLayout.addWidget(showFieldCheckbox);

rootViewLayout.addWidget(optionsArea);
rootViewLayout.addWidget(serverOutput);
rootViewLayout.addWidget(startButton);

// event handling
startButton.addEventListener('clicked', () => {
    if (display_process){
        stopProcess();
    }
    else{
        clearOutput();
        startProcess();
        startButton.setText("Stop");
    }
});

var display_process = null;
// start the display process
function startProcess(){
    const address = serverAddrInput.text();
    const password = passInput.text();
    const port = portInput.text();
    const division = divisionInput.text();
    const fieldSet = fieldSetInput.text();
    const predict = predictMatchCheckbox.isChecked();
    const omitCountry = omitCountryCheckbox.isChecked();
    const showStats = showStatsCheckbox.isChecked();
    const showField = showFieldCheckbox.isChecked();
    // const playSounds = playSoundsCheckbox.isChecked();

    let display_exec_name = process.platform == "darwin" ? "./display-mac" : "./display.exe";

    display_process = spawn(display_exec_name, [
        "-a", address, 
        "-p", password,
        "--port", port,
        "-d", division,
        "-f", fieldSet, 
        ...(predict ? ["-g"] : []),
        ...(omitCountry ? ["-o"] : []),
        ...(showStats ? ["-s"] : []),
        ...(showField ? ["-n"] : []),
        // ...(playSounds ? ["--sounds"] : [])
    ]);
    display_process.stdout.on("data", b => {
        print(b.toString());
    });
    display_process.stderr.on("data", b => {
        print(b.toString())
    });
    display_process.on("exit", () => {
        print("Server stopped.");
        enableInputs();
        startButton.setText("Start");
        display_process = null;
    });
    disableInputs();
}

function stopProcess(){
    print("Stopping server...\n");
    if (display_process){
        display_process.kill();
    }
}

// grey out all the input areas so they can't be modified while the display is running
function disableInputs(){
    serverAddrInput.setEnabled(false);
    passInput.setEnabled(false);
    portInput.setEnabled(false);
    divisionInput.setEnabled(false);
    fieldSetInput.setEnabled(false);
    predictMatchCheckbox.setEnabled(false);
    omitCountryCheckbox.setEnabled(false);
    showStatsCheckbox.setEnabled(false);
    showFieldCheckbox.setEnabled(false);
    // playSoundsCheckbox.setEnabled(false);
}

// re-enable all the inputs
function enableInputs(){
    serverAddrInput.setEnabled(true);
    passInput.setEnabled(true);
    portInput.setEnabled(true);
    divisionInput.setEnabled(true);
    fieldSetInput.setEnabled(true);
    predictMatchCheckbox.setEnabled(true);
    omitCountryCheckbox.setEnabled(true);
    showStatsCheckbox.setEnabled(true);
    showFieldCheckbox.setEnabled(true);
    // playSoundsCheckbox.setEnabled(true);
}

// print some text to the output area
function print(text){
    serverOutput.insertPlainText(text);
    serverOutputScrollBar.setSliderPosition(serverOutputScrollBar.maximum()-1);
}

// clear the output area
function clearOutput(){
    serverOutput.setPlainText("");
}

// styling
const rootStyleSheet = `
    #rootView{
        padding: 5px;
        align-items: 'center';
        width: '100%';
    }

    #optionsArea{
        text-align: center;
        padding: 10px;
        margin-bottom: 4px;
    }

    #serverAddrRow, #passRow, #portRow, #divisionRow, #fieldSetRow{
        flex-direction: row;
        margin: 5px;
    }

    #serverAddrLabel, #passLabel, #portLabel, #divisionLabel, #fieldSetLabel{
        margin-right: 0.5em;
    }

    #serverOutput{
        height: 125px;
        font: 10pt Courier;
        width: '95%';
        margin-bottom: 4px;
    }

    #startButton{
        width: '95%';
    }
`;
rootView.setStyleSheet(rootStyleSheet);

win.setCentralWidget(rootView);
win.show();

global.win = win;