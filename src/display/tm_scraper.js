/**
 * @file tm_scraper.js
 * Provides a class to get data from the Tournament Manager web interface.
 * @author John Holbrook
 */

const FormData = require('form-data');
const util = require('util');
const axios = require('axios');
const jsdom = require('jsdom');
const WebSocket = require('ws');
// const { match } = require('assert');
const protobuf = require('protobufjs');

/**
 * @class TMScraper
 * @classdesc Gets data from the Tournament Manager web interface through a combination of page scraping and websocket communication.
 */
module.exports = class TMScraper {
    /**
     * TMScraper constructor
     * @param {*} addr the address of the TM server
     * @param {*} pw TM admin password
     * @param {*} div name of the division (as used in the web interface URLs, e.g. "division1")
     * @param {*} fs ID of the field set to connect to
     * @param {boolean} omit Omit country from team name if there is also a state/province
     */
    constructor(addr, pw, div, fs, omit){
        this.addr = addr; // TM server address
        this.pw = pw; // TM admin password
        this.division = div; // name of the division (as used in the web interface URLs, e.g. "division1")
        this.fs = fs; // ID of the field set to connect to (starts at 1 and counts up from there)
        this.omit = omit ? true:false;
        
        this.program = null; // the program (e.g. "VRC", "VEXU", "VIQC")
        this.cookie = null; // the session cookie
        this.cookie_expiration = null; // the expiration time of the cookie
        
        this.teams = []; // list of teams
        this.matches = []; // list of matches
        this.rankings = []; // list of rankings
        this.skills = []; // list of skills rankings

        this.socket = null; // websocket connection to the TM server
        this.pb = null; // protobuf schema used by TM server
        this.fs_notice = null; // protobuf info for "Field Set Notice" message type

        this.onMatchQueueCallback = () => {}; // callback for when a match is queued
        this.onMatchStartedCallback = () => {}; // callback for when a match is started
        this.onTimeUpdatedCallback = () => {}; // callback for when the match time is updated (i.e., once per second during the match)
   
        // initialize websocket connection
        this._connectWebsocket();
    }

    /**
     * Authenticates with the TM server and gets the session cookie.
     */
    async _authenticate(){
        console.log(`Authenticating with TM server at http://${this.addr}...`);

        // send form data to server
        let form = new FormData();
        form.append('user', 'admin');
        form.append('password', this.pw);
        form.append('submit', '');
        let submitForm = util.promisify((addr, callback) => form.submit(addr, callback));
        let cookie_text = (await submitForm(`http://${this.addr}/admin/login`)).headers['set-cookie'][0];

        // extract the session cookie
        let cookie_data = cookie_text.split(';')[0].split('"')[1];
        this.cookie = `user="${cookie_data}"`;

        // extract the expiration time (cookie is good for 1 hour)
        let cookie_expiration = cookie_text.split(';')[1].split('=')[1];
        let expiration_date = new Date(cookie_expiration);
        this.cookie_expiration = expiration_date;
    }

    /**
     *  Make a request to the specified page on the TM server and return the response.
     * @param {string} page - the page to request
     * @returns {string} the response from the server
     */
    async _makeRequest(page){
        // if the cookie is missing or expired, authenticate
        if(!this.cookie || this.cookie_expiration < new Date()){
            await this._authenticate();
        }

        // build the url and options
        let url = `http://${this.addr}/${page}`;
        // console.log(url);
        let options = {
            headers: {
                Cookie: this.cookie,
            }
        };

        // make request
        let response = await axios.get(url, options);
        return response.data;
    }

    /**
     * 
     * @param {String} path – path to table page
     * @returns HTMLTable
     */
    async _getTableFromPage(path){
        let page_data = await this._makeRequest(path);
        let page = new jsdom.JSDOM(page_data).window.document;
        return page.querySelectorAll('table.table-striped > tbody > tr');
    }

    /**
     * Fetches the list of teams from the TM server.
     */
    async _fetchTeams(){
        let team_list = [];
        let table = await this._getTableFromPage(`${this.division}/teams`);
        table.forEach(row => {
            let cols = row.querySelectorAll('td');

            let location = null;
            if (this.omit){
                let raw_loc = cols[2].textContent;
                if (raw_loc.split(",").length > 2){
                    // there is a state/province, strip the highest-level location (country name)
                    location = raw_loc.split(",");
                    location.pop();
                    location = location.toString();
                }
                else{
                    // there is no state/province, don't modity the location
                    location = raw_loc;
                }
            }
            else{
                location = cols[2].textContent;
            }

            team_list.push({
                number: cols[0].textContent,
                name: cols[1].textContent,
                location: location,
                organization: cols[3].textContent
            });
        });
        this.teams = team_list;
        // console.log("teams: ", team_list)
    }

    /**
     * Returns the list of teams.
     * @returns {Array} the list of teams
     */
    async getTeams(){
        if (this.teams.length == 0){
            await this._fetchTeams();
        }

        return this.teams;
    }

    /**
     * Fetches the list of matches from the TM server.
     */
    async _fetchMatches(){
        // get the program, if it hasn't been determined yet
        // console.log("Fetching matches...")
        if (!this.program){
            await this._fetchProgram();
        }

        let match_list = [];
        let table = await this._getTableFromPage(`${this.division}/matches`);
        table.forEach(row => {
            match_list.push(this._extractMatchData(row));
        });
        this.matches = match_list;
    }

    /**
     * Extracts JSON data from a single row of the match table
     * @param {Object} row - the row to extract data from
     * @returns {Object} the extracted data
     */
    _extractMatchData(row){
        let cols = row.querySelectorAll('td');
        if (this.program == "VRC" || this.program == "RADC"){
            if (cols.length == 5){
                // this is a special case for WVSSAC Robotics, where qualification
                // matches are 2v2 but eliminations are 1v1. Therefore you have a VRC
                // match with only 1 team on each alliance.
                // https://www.wvroboticsalliance.org/programs/wvssac-robotics/rules
                return {
                    match_num: strip(cols[0].textContent),
                    red_1: strip(cols[1].textContent),
                    red_2: null,
                    blue_1: strip(cols[2].textContent),
                    blue_2: null
                }
            }
            else return {
                match_num: strip(cols[0].textContent),
                red_1: strip(cols[1].textContent),
                red_2: strip(cols[2].textContent),
                blue_1: strip(cols[3].textContent),
                blue_2: strip(cols[4].textContent)
            }
        }
        else if (this.program == "VEXU"){
            return {
                match_num: cols[0].textContent,
                red_1: strip(cols[1].textContent),
                blue_1: strip(cols[2].textContent)
            }
        }
        else if (this.program == "VIQC"){
            return {
                match_num: strip(cols[0].textContent),
                team_1: strip(cols[1].textContent),
                team_2: strip(cols[2].textContent)
            }
        }
    }

    /**
     * Returns the list of matches.
     * @param {boolean} force_refresh - if true, forces a refresh of the match list
     * @returns {Array} the list of matches
     */
    async getMatches(force_refresh=false){
        if (force_refresh || this.matches.length == 0){
            await this._fetchMatches();
        }

        return this.matches;
    }

    /**
     * Fetches the current team rankings from the TM webpage
     */
    async _fetchRankings(){
        // get the program, if it hasn't been determined yet
        if (!this.program){
            await this._fetchProgram();
        }

        let rankings_list = [];
        let table = await this._getTableFromPage(`${this.division}/rankings`);
        table.forEach(row => {
            rankings_list.push(...this._extractRankingData(row));
        });
        
        // for IQ, add high match score
        if (this.program == "VIQC"){
            let high_scores = await this._fetchIQHighScores();
            rankings_list.forEach(r => {
                r.high_score = high_scores[r.number]
            })
        }
        // for RADC, add high and average match scores
        else if (this.program == "RADC"){
            let high_and_avg_scores = await this._fetchRADCHighAndAvgScores();
            // console.log(high_and_avg_scores);
            rankings_list.forEach(r => {
                let tmp = high_and_avg_scores.find(e => e.number == r.number);
                r.high_score = tmp.high_score.toFixed(1);
                r.avg_score = tmp.avg_score.toFixed(1);
            });
        }

        // console.log(rankings_list)

        this.rankings = rankings_list;
    }

    /**
     * Looks through the IQ match list to compute each team's highest match score
     */
    async _fetchIQHighScores(){
        // get the program, if it hasn't been determined yet
        if (!this.program){
            await this._fetchProgram();
        }

        // initialize the high scores table with a value of 0 for each team
        let high_scores = {}
        let teams = await this.getTeams();
        teams.forEach(team => {
            high_scores[team.number] = 0
        });

        let table = await this._getTableFromPage(`${this.division}/matches`);
        table.forEach(row => {
            let cols = row.querySelectorAll('td');
            let team1 = strip(cols[1].textContent);
            let team2 = strip(cols[2].textContent);
            let score = Number(cols[3].textContent);
            if (score > high_scores[team1]) high_scores[team1] = score;
            if (score > high_scores[team2]) high_scores[team2] = score;
        });

        return high_scores;
    }

    /**
     * Looks through the RADC match list to compute each team's highest and average match score
     */
    async _fetchRADCHighAndAvgScores(){
         // get the program, if it hasn't been determined yet
         if (!this.program){
            await this._fetchProgram();
        }

        // first build a list of each team's match scores
        // initialize an empty list for each team
        let team_scores = {}
        let teams = await this.getTeams();
        teams.forEach(team => {
            team_scores[team.number] = [];
        });

        let table = await this._getTableFromPage(`${this.division}/matches`);
        table.forEach(row => {
            let cols = row.querySelectorAll('td');

            // assume that if both alliances' scores are 0, the match just hasn't been scored yet
            if (strip(cols[5].textContent) != "0" || strip(cols[6].textContent) != "0"){
                team_scores[cols[1].textContent].push(Number(cols[5].textContent))
                team_scores[cols[2].textContent].push(Number(cols[5].textContent))
                team_scores[cols[3].textContent].push(Number(cols[6].textContent))
                team_scores[cols[4].textContent].push(Number(cols[6].textContent))
            }
        });

        // now calculate the high and average scores for each team
        let stats = []
        this.teams.forEach(team => {
            let scores = team_scores[team.number];
            stats.push({
                number: team.number,
                avg_score: scores.length > 0 ? arrayAvg(scores) : 0,
                high_score: scores.length > 0 ? Math.max(...scores) : 0
            });
        })
        return stats;
    }

    /**
     * Extracts JSON data from a single row of the rankings table
     * @param {Object} row - the row to extract data from
     * @returns {Object} the extracted data
     */
    _extractRankingData(row){
        let cols = row.querySelectorAll('td');
        if (this.program == "VRC" || this.program == "VEXU"){
            // compute AWP rate and auton win rate
            let wlt_split = cols[6].textContent.split("-");
            let wins = Number(wlt_split[0]);
            let losses = Number(wlt_split[1]);
            let ties = Number(wlt_split[2]);
            let win_wp = (wins*2) + ties;
            let total_wp = Math.round(Number(cols[3].textContent) * (wins+losses+ties))
            let awp_rate = (100 * (total_wp - win_wp) / (wins+losses+ties));
            awp_rate = isNumber(awp_rate) ? awp_rate.toFixed(0) : "0";
            
            let num_auto_wins = Math.round(Number(cols[4].textContent) * (wins+losses+ties)) / 10;
            let auto_win_rate = (100 * num_auto_wins / (wins+losses+ties));
            auto_win_rate = isNumber(auto_win_rate) ? auto_win_rate.toFixed(0) : "0";

            return [{
                rank: cols[0].textContent,
                number: cols[1].textContent,
                name: cols[2].textContent,
                wp: cols[3].textContent,
                ap: cols[4].textContent,
                sp: cols[5].textContent,
                wlt: cols[6].textContent,
                awp_rate: `${awp_rate}%`,
                auto_win_rate: `${auto_win_rate}%`
            }]
        }
        else if (this.program == "VIQC"){
            if (cols[1].textContent.indexOf(",") > -1){
                // if the entry in the "team number" column contains a comma,
                // these are finals rankings and each row is used for 2 teams
                return [
                    {
                        rank: cols[0].textContent,
                        number: cols[1].textContent.split(", ")[0],
                        name: cols[2].textContent.split(", ")[0], // hope the team name doesn't have a comma :P
                        matches: cols[3].textContent,
                        avg_score: cols[4].textContent
                    },
                    {
                        rank: cols[0].textContent,
                        number: cols[1].textContent.split(", ")[1],
                        name: cols[2].textContent.split(", ")[1], // hope the team name doesn't have a comma :P
                        matches: cols[3].textContent,
                        avg_score: cols[4].textContent
                    }
                ]
            }
            else{ // otherwise we're in quals
                return [{
                    rank: cols[0].textContent,
                    number: cols[1].textContent,
                    name: cols[2].textContent,
                    matches: cols[3].textContent,
                    avg_score: cols[4].textContent
                }]
            }
        }
        else if (this.program == "RADC"){
            return [{
                rank: cols[0].textContent,
                number: cols[1].textContent,
                name: cols[2].textContent,
                wp: cols[3].textContent,
                sp: cols[4].textContent,
                wlt: cols[5].textContent
            }]
        }
    }

    /**
     * Returns the list of rankings.
     * @param {boolean} force_refresh - if true, forces a refresh of the rankings list
     * @returns {Array} the list of rankings
     */
    async getRankings(force_refresh=false){
        if (force_refresh || this.rankings.length == 0){
            await this._fetchRankings();
        }

        return this.rankings;
    }

    /**
     * Fetches the current skills rankings from the TM webpage
     */
    async _fetchSkills(){
        // get the program, if it hasn't been determined yet
        if (!this.program){
            await this._fetchProgram();
        }
        // let page_data = await this._makeRequest(`skills/rankings`);
        // let page = new jsdom.JSDOM(page_data).window.document;
        let skills_list = [];
        // page.querySelectorAll('table.table-striped > tbody > tr').forEach(row => {
        let table = await this._getTableFromPage(`skills/rankings`);
        table.forEach(row => {
            skills_list.push(this._extractSkillsData(row))
        })
        this.skills = skills_list;
    }

    /**
     * Extracts JSON data from a single row of the skills table
     * @param {Object} row - the row to extract data from
     * @returns {Object} the extracted data
     */
    _extractSkillsData(row){
        let cols = row.querySelectorAll('td');
        return {
            skills_rank: cols[0].textContent,
            number: cols[1].textContent,
            name: cols[2].textContent,
            total_skills_score: cols[3].textContent,
            high_programming: cols[4].textContent,
            programming_attempts: cols[5].textContent,
            high_driving: cols[6].textContent,
            driving_attemps: cols[7].textContent
        }
    }

    /**
     * Returns the list of rankings.
     * @param {boolean} force_refresh - if true, forces a refresh of the rankings list
     * @returns {Array} the list of rankings
     */
     async getSkills(force_refresh=false){
        if (force_refresh || this.skills.length == 0){
            await this._fetchSkills();
        }

        return this.skills;
    }

    /**
     * Determine alliance bracket seeds for VRC or RADC events
     * @returns {Object} list of elimination seeds
     */
    async _calculateElimSeeds(){
        // lookup table to determine an alliance's seed based on the elimination match where they first appear
        // e.g. if an alliance's first appearance is blue in R161-1, then they must be #16
        // if their first appearance is red in QF2-1, then they must be #4, etc.
        const seedLookupTable = {
            "R161-1" : {red: 1, blue: 16},
            "R162-1" : {red: 8, blue: 9},
            "R163-1" : {red: 4, blue: 13},
            "R164-1" : {red: 5, blue: 12},
            "R165-1" : {red: 2, blue: 15},
            "R166-1" : {red: 7, blue: 10},
            "R167-1" : {red: 3, blue: 14},
            "R168-1" : {red: 6, blue: 11},
            // we need to do all the elimination matches, not just R16, because if there are < 32 teams some alliances will get byes
            "QF1-1" : {red: 1, blue: 8},
            "QF2-1" : {red: 4, blue: 5},
            "QF3-1" : {red: 2, blue: 7},
            "QF4-1" : {red: 3, blue: 6},
            "SF1-1" : {red: 1, blue: 4},
            "SF2-1" : {red: 2, blue: 3},
            "F1" : {red: 1, blue: 2},
            // and let's do R32 as well just for fun
            "R321-1": {red: 1, blue: 32},
            "R322-1": {red: 16, blue: 17},
            "R323-1": {red: 8, blue: 25},
            "R324-1": {red: 9, blue: 24},
            "R325-1": {red: 4, blue: 29},
            "R326-1": {red: 13, blue: 20},
            "R327-1": {red: 5, blue: 28},
            "R328-1": {red: 12, blue: 21},
            "R329-1": {red: 2, blue: 31},
            "R3210-1": {red: 15, blue: 18},
            "R3211-1": {red: 7, blue: 26},
            "R3212-1": {red: 10, blue: 23},
            "R3213-1": {red: 3, blue: 30},
            "R3214-1": {red: 14, blue: 19},
            "R3215-1": {red: 6, blue: 27},
            "R3216-1": {red: 11, blue: 22},
            // TM technically supports elimination brackets with up to 128 alliances but c'mon, no one ever goes beyond 32
        }
        const qp_re = new RegExp('[QP][1-9]');// regex to match practice or qualification match numbers

        // get the program, if it hasn't been determined yet
        if (!this.program){
            await this._fetchProgram();
        }
        // get the list of teams if we don't have them yet
        if (this.teams.length == 0){
            await this._fetchTeams();
        }

        let seeds = {};
        let match_table = await this._getTableFromPage(`${this.division}/matches`);
        match_table.forEach(row => {
            let cols = row.querySelectorAll('td');

            // get the match number
            let matchnum = strip(cols[0].textContent);
            if (!qp_re.test(matchnum.substring(0,2))){
                // this is an elimination match

                if (cols.length == 7){
                    // VRC or RADC
                    let red1 = strip(cols[1].textContent);
                    let red2 = strip(cols[2].textContent);
                    let blue1 = strip(cols[3].textContent);
                    let blue2 = strip(cols[4].textContent);

                    if (!seeds.hasOwnProperty(red1)) seeds[red1] = seedLookupTable[matchnum].red;
                    if (!seeds.hasOwnProperty(red2)) seeds[red2] = seedLookupTable[matchnum].red;
                    if (!seeds.hasOwnProperty(blue1)) seeds[blue1] = seedLookupTable[matchnum].blue;
                    if (!seeds.hasOwnProperty(blue2)) seeds[blue2] = seedLookupTable[matchnum].blue;
                }
                else if (cols.length == 5){
                    // VEXU or WVSSAC
                    let red = strip(cols[1].textContent);
                    let blue = strip(cols[2].textContent);

                    if (!seeds.hasOwnProperty(red)) seeds[red] = seedLookupTable[matchnum].red;
                    if (!seeds.hasOwnProperty(blue)) seeds[blue] = seedLookupTable[matchnum].blue;
                }
            }
        });

        return seeds;
    }

    /** 
     * Determines which program is being run (VRC, VIQC, VEXU, or RADC)
     */
    async _fetchProgram(){
        let matches_page_data = await this._makeRequest(`${this.division}/matches`);
        let matches_page = new jsdom.JSDOM(matches_page_data).window.document;
        let matches_row = matches_page.querySelector('table.table-striped > tbody > tr').querySelectorAll('td');

        let rankings_page_data = await this._makeRequest(`${this.division}/rankings`);
        let rankings_page = new jsdom.JSDOM(rankings_page_data).window.document;
        let raknings_row = rankings_page.querySelector('table.table-striped > tbody > tr').querySelectorAll('td');

        if (matches_row.length == 4){
            this.program = "VIQC";
        }
        else if (matches_row.length == 5){
            this.program = "VEXU";
        }
        else if (matches_row.length == 7){
            if (raknings_row.length == 6){
                this.program = "RADC";
            }
            else{
                this.program = "VRC";
            }
        }
    }

    /**
     * Returns the program.
     * @returns {String} the program
     */
     async getProgram(){
        if (!this.program){
            await this._fetchProgram();
        }

        return this.program;
    }

    /**
     * Establishes a websocket connection to the TM server.
     */
    async _connectWebsocket(){
        // if the cookie is missing or expired, authenticate
        if(!this.cookie || this.cookie_expiration < new Date()){
            await this._authenticate();
        }

        // if the websocket is already open, do nothing
        if (this.websocket){
            return;
            // this.websocket.close();
            // this.websocket = null;
        }

        // open and parse the protobuf schema
        this.pb = await protobuf.load("./src/display/fieldset.proto");
        this.fs_notice = this.pb.lookupType("FieldSetNotice");

        this.websocket = new WebSocket(`ws://${this.addr}/fieldsets/${this.fs}`, {
            headers: {
                Cookie: this.cookie
            }
        });

        this.websocket.on('open', () => {
            console.log('WebSocket connected');

            // send handshake to TM
            let hs = this._generateHandshake();
            console.log("Initiating handshake...");
            this._wsSend(hs); 
        });

        this.websocket.on('close', () => {
            console.log('WebSocket disconnected');
        });

        this.websocket.on('message', async event => {
            await this._handleEvent(event);
        });
    }

    /**
     * Send a message to the TM server via websockets
     * @param {Buffer} data - data to send
     */
    async _wsSend(data){
        await this._connectWebsocket();
        this.websocket.send(data);
    }

    /**
     * Generates the "handshake message" needed to send to TM.
     * The message is 128 bytes long, namely:
     * - 7 bytes of padding (content irrelevant)
     * - Current UNIX timestamp in seconds since epoch (little-endian). Must be within 300s of TM server's time for handshake to be accepted.
     * - 117 bytes of padding (content irrelevant)
     * Yes, really. ¯\_(ツ)_/¯
     */
    _generateHandshake(){
        let unixTime = (Math.floor(Date.now() / 1000)).toString(16); // unix timestamp in big-endian hex
        
        // create byte array
        let hs = new Uint8Array(128);

        // write time to byte array (little-endian)
        hs[7]  = parseInt(unixTime.slice(6,8), 16);
        hs[8]  = parseInt(unixTime.slice(4,6), 16);
        hs[9]  = parseInt(unixTime.slice(2,4), 16);
        hs[10] = parseInt(unixTime.slice(0,2), 16);
        
        return hs;
    }

    /**
     * "Unmangles" a message recieved from the TM server into something decodable as a protobuf
     */
    _unmangle(raw_data){
        let magic_number = raw_data[0] ^ 229;
        // console.log("Magic number: ", magic_number);

        let unmangled_data = Buffer.alloc(raw_data.length-1);
        for (let i=1; i<raw_data.length; i++){
            unmangled_data[i-1] = raw_data[i] ^ magic_number;
        }

        return unmangled_data;
    }

    /**
     * Generates a match name as displayed in TM (e.g. "Q123" or "SF 1-1")
     * from a V3MatchTuple object 
     * @param {Object} match 
     * @returns Name of the match as displayed in TM
     */
    _buildMatchName(match){
        const elim_rounds = {
            3: "QF",
            4: "SF",
            5: "F",
            6: "R16",
            7: "R32",
            8: "R64",
            9: "R128"
        }
        
        if (match.round == 2) {
            return `Q${match.match}`;
        }
        else if (match.round in elim_rounds.keys()){
            return `${elim_rounds[match.round]} ${match.isntance}-${match.round}`
        }
        else if (match.round == 0) return "NONE";
        else if (match.round == 1) return "P0";
        else if (match.round == 18) return "TO";
        else if (match.round == 17){
            // RIP to the name "Programming Skills", 2007 - 2023 :(
            return match.instance == 2 ? "D Skills" : "A Coding";
        }
        else return "OTHER";
    }

    /**
     * Handles an event from the TM server (recieved via websockets).
     */
    async _handleEvent(event){
        // console.log("Recieved: ", event);
        let unmangled_event = this._unmangle(event);
        let decoded = this.fs_notice.decode(unmangled_event);
        
        console.log(decoded);

        if (decoded.id == 8) { // ASSIGN_FIELD_MATCH – i.e. match queued
            const ingore = [0, 1, 17, 18];
            if (!ingore.includes(decoded.match.round)){
                // `ignore` is a list of match types that the intro display should
                // ignore (Practice, Skills, Timeout, etc.)
                let match_name = this._buildMatchName(decoded.match);
                let match_info = await this.getMatchTeams(match_name);
                this.onMatchQueueCallback(match_info);
            }
        }
        else if (decoded.id == 1){ // MATCH_STARTED
            this.onMatchStartedCallback();
        }
        else if (decoded.id == 8){ // TIME_UPDATED
            this.onMatchQueueCallback();
        }
        // there are various other event types too, but for now we don't care about them
    }

    /**
     * Sets the callback to be executed when a match is queued.
     * @param {function} callback - the callback to be executed
     */
    async onMatchQueue(callback){
        this.onMatchQueueCallback = callback;
        // await this._connectWebsocket();
    }

    /**
     * Sets the callback to be executed when a match is started. 
     * @param {function} callback - the callback to be executed
     */
    async onMatchStarted(callback){
        this.onMatchStartedCallback = callback;
        // await this._connectWebsocket();
    }

    /**
     * Sets the callback to be executed when the match time changes
     * (i.e., once per second while the match is running)
     * @param {function} callback - the callback to be executed
     */
    async onMatchTimeUpdated(callback){
        this.onTimeUpdatedCallback = callback;
        // await this._connectWebsocket();
    }

    /**
     * Gets info about the teams in a particular match.
     * @param {string} match_num - the match number (e.g. "Q20")
     */
    async getMatchTeams(match_num){
        // get the list of teams and matches if we don't have them yet
        if (this.teams.length == 0){
            await this._fetchTeams();
        }
        if (this.matches.length == 0){
            await this._fetchMatches();
        }

        // pull new ranking & skills data
        await this._fetchRankings();
        await this._fetchSkills();

        // for some reason some match numbers returned from the websocket have spaces in them
        match_num = strip(match_num);

        let match = this.matches.find(m => strip(m.match_num) == match_num);
        if (!match){
            // if we didn't find the match, maybe it's been created since we last fetched the list
            await this._fetchMatches();
            // console.log(this.matches);
            match = this.matches.find(m => strip(m.match_num) == match_num);
            if (!match){
                throw new Error(`Match ${match_num} not found`);
            }
        }

        // console.log(match);

        if (this.program == "VRC" || this.program == "RADC" || this.program == "VEXU"){
            // if this is an elimination match, get bracket seedings
            const qp_re = new RegExp('[QP][1-9]'); // regex to match practice or qualification match numbers
            let seeds = qp_re.test(match_num) ? null : await this._calculateElimSeeds();

            if (!match.red_2 && !match.blue_2){
                // special case for WVSSAC Robotics events where eliminations are 1v1
                // https://www.wvroboticsalliance.org/programs/wvssac-robotics/rules
                return await {
                    match_num: match_num,
                    program: this.program,
                    red_1: { ...(await this._getTeamData(match.red_1)), ...(seeds ? {seed: seeds[match.red_1]} : {}) },
                    blue_1: { ...(await this._getTeamData(match.blue_1)), ...(seeds ? {seed: seeds[match.blue_1]} : {}) },
                }
            }
            else{
                return await {
                    match_num: match_num,
                    program: this.program,
                    red_1: { ...(await this._getTeamData(match.red_1)), ...(seeds ? {seed: seeds[match.red_1]} : {}) },
                    red_2: { ...(await this._getTeamData(match.red_2)), ...(seeds ? {seed: seeds[match.red_2]} : {}) },
                    blue_1: { ...(await this._getTeamData(match.blue_1)), ...(seeds ? {seed: seeds[match.blue_1]} : {}) },
                    blue_2: { ...(await this._getTeamData(match.blue_2)), ...(seeds ? {seed: seeds[match.blue_2]} : {}) },
                }
            }
        }
        else if (this.program == "VEXU"){
            return await {
                match_num: match_num,
                program: "VEXU",
                red_1: await this._getTeamData(match.red_1),
                blue_1: await this._getTeamData(match.blue_1)
            }
        }
        else if (this.program == "VIQC"){
            return await {
                match_num: match_num,
                program: "VIQC",
                team_1: await this._getTeamData(match.team_1),
                team_2: await this._getTeamData(match.team_2)
            }
        }
    }

    /**
     * Gets data about a particular team.
     * @param {string} team_num - the team number (e.g. "1234A")
     */
    async _getTeamData(team_num){
        // get the list of teams if we don't have them yet
        if (this.teams.length == 0){
            await this._fetchTeams();
        }

        let team = this.teams.find(t => t.number == team_num);
        let team_rank = this.rankings.find(r => r.number == team_num);
        let team_skills = this.skills.find(s => s.number == team_num);
        // return team;
        return {
            ...team,
            ...team_rank,
            ...team_skills
        }
    }
}

/**
 * Strip whitespace from a string.
 * @param {string} str - the string to strip
 * @returns {string} the stripped string
 */
function strip(str){
    return str.replace(/\s+/g, '');
}

/**
 * Returns True if the given value is a number
 * @param {*} value - value to check
 * @returns {Boolean}
 */
function isNumber(value){
    return typeof value === 'number' && isFinite(value);
}

/**
 * Returns the average of all numbers in an array
 * @param {Array} array – array of numbers
 * @returns {Number} average of all values
 */
function arrayAvg(array){
    let sum = 0;
    array.forEach(n => {
        sum += n;
    });
    return sum/array.length;
}