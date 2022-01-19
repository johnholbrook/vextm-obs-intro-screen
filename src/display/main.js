const { exit } = require('process');
const TMScraper = require('./tm_scraper.js');
const server = require('./server.js');
const vrc_match_predictor = require('./vrc_match_predictor.js');
const stats = require("./team_stats.js");

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
                    description: "Division name (as used in TM web interface URLs - only set this option at multi-division events)",
                    type: "string",
                    default: "division1"
                  })
                  .option("field-set", {
                    alias: "f",
                    description: "ID of the field set to connect to (only set if you have multiple field sets)",
                    type: "number",
                    default: 1
                  })
                  .option("omit-country", {
                    alias: "o",
                    description: "Omit country from team location if there is also a state/province",
                    type: "boolean",
                    default: false
                  })
                  .option("show-stats", {
                    alias: "s",
                    description: "Show additional scouting stats",
                    type: "boolean",
                    default: false
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
    let tm_scraper = new TMScraper(args.address, args.password, args['division-name'], args['field-set'], args['omit-country']);

    // when a new match is queued, send the info to all connected clients
    tm_scraper.onMatchQueue(async (m) => {
        // add team scouting data, if applicable
        if (args['show-stats']){
            m = await stats.AddTeamStats(m);
        }

        // add match prediction, if applicable
        if (m.program == "VRC" && args["show-predictions"]){
            m.prediction = await vrc_match_predictor.predict(m);
        }

        // send match info to clients
        server.emit("match_queued", m);

        // if (m.program == "VRC" && args['show-predictions']){
        //     // get the match prediction before sending info to clients
        //     m.prediction = await vrc_match_predictor.predict(m);
        //     // vrc_match_predictor.predict(m).then(prediction => {
        //     //     m.prediction = prediction;
        //     //     server.emit("match_queued", m);
        //     // });
        // }
        // else{
        //     // don't get the prediction, just send the info
        //     server.emit("match_queued", m);
        // }   
    });

    // when a match is started, send the info to all connected clients
    tm_scraper.onMatchStarted(() => {
        server.emit("match_started");
    });

    // start the web server
    server.startServer(args.port);
}

main();