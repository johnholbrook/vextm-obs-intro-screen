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
        this.onMatchQueueCallback = () => {}; // callback for when a match is queued
        this.onMatchStartedCallback = () => {}; // callback for when a match is started
        this.onTimeUpdatedCallback = () => {}; // callback for when the match time is updated (i.e., once per second during the match)
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
                Cookie: this.cookie
            }
        };

        // make request
        let response = await axios.get(url, options);
        return response.data;
    }

    /**
     * Fetches the list of teams from the TM server.
     */
    async _fetchTeams(){
        let page_data = await this._makeRequest(`${this.division}/teams`);
        let page = new jsdom.JSDOM(page_data).window.document;
        let team_list = [];
        page.querySelectorAll('table.table-striped > tbody > tr').forEach(row => {
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

        let page_data = await this._makeRequest(`${this.division}/matches`);
        let page = new jsdom.JSDOM(page_data).window.document;
        let match_list = [];
        page.querySelectorAll('table.table-striped > tbody > tr').forEach(row => {
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

        let page_data = await this._makeRequest(`${this.division}/rankings`);
        let page = new jsdom.JSDOM(page_data).window.document;
        let rankings_list = [];
        page.querySelectorAll('table.table-striped > tbody > tr').forEach(row => {
            rankings_list.push(this._extractRankingData(row));
        });
        
        // for IQ only, add high match score
        if (this.program == "VIQC"){
            let high_scores = await this._fetchIQHighScores();
            this.teams.forEach(team => {
                rankings_list.find(r => r.number == team.number).high_score = high_scores[team.number]
            });
        }

        this.rankings = rankings_list;
    }

    /**
     * Looks through the match list to compute each team's highest match score
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

        let page_data = await this._makeRequest(`${this.division}/matches`);
        let page = new jsdom.JSDOM(page_data).window.document;
        page.querySelectorAll('table.table-striped > tbody > tr').forEach(row => {
            let cols = row.querySelectorAll('td');
            let team1 = strip(cols[1].textContent);
            let team2 = strip(cols[2].textContent);
            let score = Number(cols[3].textContent);
            console.log(team1, team2, score)
            if (score > high_scores[team1]) high_scores[team1] = score;
            if (score > high_scores[team2]) high_scores[team2] = score;
        });

        return high_scores;
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
            awp_rate = isNumber(awp_rate) ? awp_rate.toFixed(1) : "0.0";
            
            let num_auto_wins = Math.round(Number(cols[4].textContent) * (wins+losses+ties)) / 10;
            let auto_win_rate = (100 * num_auto_wins / (wins+losses+ties));
            auto_win_rate = isNumber(auto_win_rate) ? auto_win_rate.toFixed(1) : "0.0";

            return {
                rank: cols[0].textContent,
                number: cols[1].textContent,
                name: cols[2].textContent,
                wp: cols[3].textContent,
                ap: cols[4].textContent,
                sp: cols[5].textContent,
                wlt: cols[6].textContent,
                awp_rate: `${awp_rate}%`,
                auto_win_rate: `${auto_win_rate}%`
            }
        }
        else if (this.program == "VIQC"){
            return {
                rank: cols[0].textContent,
                number: cols[1].textContent,
                name: cols[2].textContent,
                matches: cols[3].textContent,
                avg_score: cols[4].textContent
            }
        }
        else if (this.program == "RADC"){
            return{
                rank: cols[0].textContent,
                number: cols[1].textContent,
                name: cols[2].textContent,
                wp: cols[3].textContent,
                sp: cols[4].textContent,
                wlt: cols[5].textContent
            }
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
        let page_data = await this._makeRequest(`skills/rankings`);
        let page = new jsdom.JSDOM(page_data).window.document;
        let skills_list = [];
        page.querySelectorAll('table.table-striped > tbody > tr').forEach(row => {
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

        this.websocket = new WebSocket(`ws://${this.addr}/fieldsets/${this.fs}`, {
            headers: {
                Cookie: this.cookie
            }
        });

        this.websocket.on('open', () => {
            console.log('WebSocket connected');
        });
        this.websocket.on('close', () => {
            console.log('WebSocket disconnected');
        });
        this.websocket.on('message', async event => {
            let data = JSON.parse(event.toString());
            // console.log(data);
            await this._handleEvent(data);
        });
    }

    /**
     * Handles an event from the TM server (recieved via websockets).
     */
    async _handleEvent(event){
        if (event.type == "fieldMatchAssigned"){
            // console.log(`Match Queued: ${event.name}`)
            let ingore = ["Unknown", "P0", "D Skills", "P Skills"]
            if (!ingore.includes(event.name)){
                // a match name "unknown" means there is no match queued
                // also ignore "P0" which is the practice match with no teams
                // and skills matches (no teams there either)
                let match_info = await this.getMatchTeams(event.name);
                this.onMatchQueueCallback(match_info);
            }
        }
        else if (event.type == "matchStarted"){
            this.onMatchStartedCallback();
        }
        else if (event.type == "timeUpdated"){
            this.onTimeUpdatedCallback(event);
        }
        // there are various other event types too, but for now we don't care about them
    }

    /**
     * Sets the callback to be executed when a match is queued.
     * @param {function} callback - the callback to be executed
     */
    async onMatchQueue(callback){
        this.onMatchQueueCallback = callback;
        await this._connectWebsocket();
    }

    /**
     * Sets the callback to be executed when a match is started. 
     * @param {function} callback - the callback to be executed
     */
    async onMatchStarted(callback){
        this.onMatchStartedCallback = callback;
        await this._connectWebsocket();
    }

    /**
     * Sets the callback to be executed when the match time changes
     * (i.e., once per second while the match is running)
     * @param {function} callback - the callback to be executed
     */
    async onMatchTimeUpdated(callback){
        this.onTimeUpdatedCallback = callback;
        await this._connectWebsocket();
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

        if (this.program == "VRC" || this.program == "RADC"){
            return await {
                match_num: match_num,
                program: this.program,
                red_1: await this._getTeamData(match.red_1),
                red_2: await this._getTeamData(match.red_2),
                blue_1: await this._getTeamData(match.blue_1),
                blue_2: await this._getTeamData(match.blue_2)
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
        let team_skills = this.skills.find(s => s.number == team_num)
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