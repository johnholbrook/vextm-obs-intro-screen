const { exit } = require('process');
const TMScraper = require('./tm_scraper.js');
const server = require('./server.js');
const vrc_match_predictor = require('./vrc_match_predictor.js');
const stats = require("./team_stats.js");

// set up command-line args
const yargs = require('yargs');
const args = yargs.command("tm-stream-widgets", "Serve additional TM displays as web pages")
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
                  .option("sounds", {
                    description: "Play VRC sound effects through intro overlay",
                    type: "boolean",
                    default: false
                  })
                  .option('show-field-name', {
                    alias: 'n',
                    description: "Show field name on intro display",
                    type: "boolean",
                    default: false
                  })
                  .option('help', {
                    alias: 'h',
                    description: "Display this help message and exit",
                    type: "boolean"
                  }).argv;


async function main(){
    if (!args.password){
        console.error("Must specify TM admin password");
        exit();
    }

    // create the TM scraper
    let tm_scraper = new TMScraper(args.address, args.password, args['division-name'], args['field-set'], args['omit-country'], args['show-field-name']);

    // start fetching team stats, if applicable
    let team_stats = null;
    let program = await tm_scraper.getProgram();

    // when a new match is queued, send the info to all connected clients
    tm_scraper.onMatchQueue(async (m) => {
        // add team scouting data, if applicable
        if (args['show-stats']){
            m.show_stats = true;
        }

        // add match prediction, if applicable
        if (m.program == "VRC" && args["show-predictions"]){
            m.prediction = await vrc_match_predictor.predict(m);
        }

        // send match info to clients
        server.emit("match_queued", m);
    });

    // when a match is started, send the info to all connected clients
    tm_scraper.onMatchStarted(() => {
        server.emit("match_started", args["sounds"]);
    });

    tm_scraper.onMatchTimeUpdated((e) =>{
        e.play_sounds = args["sounds"];
        server.emit("match_time_updated", e);
    });

    // start the web server
    server.startServer(args.port);

    // tm_scraper.getRankings(true);
    // console.log(await tm_scraper._fetchElimSeeds());
}

main();