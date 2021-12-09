const { QMainWindow, QWidget, FlexLayout, QLabel, QLineEdit, QCheckBox, QPlainTextEdit, QTextEdit, QPushButton } = require("@nodegui/nodegui");
const { spawn } = require("child_process");

// create the window
const win = new QMainWindow();
win.setWindowTitle("VEX TM Intro Screen");
win.resize(500, 400);

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

// checkbox to show match predictions
const predictMatchCheckbox = new QCheckBox();
predictMatchCheckbox.setText("Show match prediction (VRC only)");

// area to show the output of the server
// const serverOutput = new QPlainTextEdit();
const serverOutput = new QTextEdit();
serverOutput.setObjectName("serverOutput");
// serverOutput.setVerticalScrollBarPolicy(1);
// serverOutput.setReadOnly(true);
serverOutput.setWordWrapMode(3);

// Button to start the server
const startButton = new QPushButton();
startButton.setText("Start");
startButton.setObjectName("startButton");

// Add the widgets to their respective layouts
optionsAreaLayout.addWidget(serverAddrRow);
optionsAreaLayout.addWidget(passRow);
optionsAreaLayout.addWidget(portRow);
optionsAreaLayout.addWidget(divisionRow);
optionsAreaLayout.addWidget(predictMatchCheckbox)

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
    const predict = predictMatchCheckbox.isChecked();

    display_process = spawn("./src/display/display.exe", ["-a", address, "-p", password, "--port", port, "-d", division, ...(predict ? ["-G"] : [])]);
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
    serverAddrInput.setDisabled(true);
    passInput.setDisabled(true);
    portInput.setDisabled(true);
    divisionInput.setDisabled(true);
    predictMatchCheckbox.setDisabled(true);
}

// re-enable all the inputs
function enableInputs(){
    serverAddrInput.setDisabled(false);
    passInput.setDisabled(false);
    portInput.setDisabled(false);
    divisionInput.setDisabled(false);
    predictMatchCheckbox.setDisabled(false);
}

var serverOutputContent = "";
// print some text to the output area
function print(text){
    serverOutputContent += text;
    serverOutput.setPlainText(serverOutputContent);
    // serverOutput.scrollToAnchor();
    serverOutput.ensureCursorVisible();
}

// clear the output area
function clearOutput(){
    serverOutputContent = "";
    serverOutput.setPlainText("");
    serverOutput.ensureCursorVisible();
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

    #serverAddrRow, #passRow, #portRow, #divisionRow{
        flex-direction: row;
        margin: 5px;
    }

    #serverAddrLabel, #passLabel, #portLabel, #divisionLabel{
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