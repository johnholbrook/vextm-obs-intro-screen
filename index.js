const { exit } = require('process');
const TMScraper = require('./tm_scraper.js');


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

    let tm_scraper = new TMScraper(args.address, args.password, args['division-name']);

    tm_scraper.onMatchQueue(console.log);
}

main();