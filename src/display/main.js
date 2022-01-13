const { exit } = require('process');
const TMScraper = require('./tm_scraper.js');
const server = require('./server.js');
const vrc_match_predictor = require('./vrc_match_predictor.js');

// set up command-line args
const yargs = require('yargs');
const args = yargs.command("match-intro", "Serve a match intro screen")
                  .option('address', {
                    alias: 'a',  
                    description: "VEX TM Server Address",
                    type: "string",
                    default: "localhost"
                  })
                  .option('password', {
                    alias: 'p',
                    description: "VEX TM Admin Password",
                    type: "string"
                  })
                  .option('show-predictions', {
                    alias: ['g', 'predict'],
                    description: "Show match predictions (VRC only)",
                    type: "boolean"
                  })
                  .option('port', {
                    alias: 'P',
                    description: "Port to serve display on",
                    type: "number",
                    default: 8080
                  })
                  .option("division-name", {
                    alias: "d",
                    description: "Division name (as used in TM web interface URLs – only set this option at multi-division events)",
                    type: "string",
                    default: "division1"
                  })
                  .option("field-set", {
                    alias: "f",
                    description: "ID of the field set to connect to (only set if you have multiple field sets)",
                    type: "number",
                    default: 1
                  })
                  .option('help', {
                    alias: 'h',
                    description: "Display this help message and exit",
                    type: "boolean"
                  }).argv;


function main(){
    if (!args.password){
        console.error("Must specify TM admin password");
        exit();
    }

    // create the TM scraper
    let tm_scraper = new TMScraper(args.address, args.password, args['division-name'], args['field-set']);

    // when a new match is queued, send the info to all connected clients
    tm_scraper.onMatchQueue(m => {
        if (m.program == "VRC" && args['show-predictions']){
            // get the match prediction before sending info to clients
            vrc_match_predictor.predict(m).then(prediction => {
                m.prediction = prediction;
                server.emit("match_queued", m);
            });
        }
        else{
            // don't get the prediction, just send the info
            server.emit("match_queued", m);
        }   
    });

    // when a match is started, send the info to all connected clients
    tm_scraper.onMatchStarted(() => {
        server.emit("match_started");
    });

    // start the web server
    server.startServer(args.port);

    // console.log(`Display script CWD: ${process.cwd()}`);
}

main();