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
     */
    constructor(addr, pw, div){
        this.addr = addr; // TM server address
        this.pw = pw; // TM admin password
        this.division = div; // name of the division (as used in the web interface URLs, e.g. "division1")
        
        this.program = null; // the program (e.g. "VRC", "VEXU", "VIQC")
        this.cookie = null; // the session cookie
        this.cookie_expiration = null; // the expiration time of the cookie
        
        this.teams = []; // list of teams
        this.matches = []; // list of matches

        this.socket = null; // websocket connection to the TM server
        this.onMatchQueueCallback = null; // callback for when a match is queued
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
            team_list.push({
                number: cols[0].textContent,
                name: cols[1].textContent,
                location: cols[2].textContent,
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
     * Extracts JSON data from a single row of the match table
     * @param {Object} row - the row to extract data from
     * @returns {Object} the extracted data
     */
    _extractMatchData(row){
        let cols = row.querySelectorAll('td');
        if (this.program == "VRC"){
            return {
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
     * Determines which program is being run (VRC, VIQC, VEXU, etc.)
     */
    async _fetchProgram(){
        // console.log("Fetching program...");
        let page_data = await this._makeRequest(`${this.division}/matches`);
        let page = new jsdom.JSDOM(page_data).window.document;
        let headers = page.querySelectorAll('table.table-striped > thead > tr > th');
        if (headers[1].textContent == "Red Teams"){
            // VRC, VEXU, or RADC
            let row = page.querySelector('table.table-striped > tbody > tr').querySelectorAll('td');
            if (row.length == 5){
                this.program = "VEXU"; // or VAIC
            }
            else if (row.length == 7){
                this.program = "VRC"; // or RADC
            }
        }
        else if (headers[1].textContent == "Team 1"){
            this.program = "VIQC";
        }
    }

    /**
     * Establishes a websocket connection to the TM server.
     */
    async _connectWebsocket(){
        // if the cookie is missing or expired, authenticate
        if(!this.cookie || this.cookie_expiration < new Date()){
            await this._authenticate();
        }

        // if the websocket is already open, close it
        if (this.websocket){
            this.websocket.close();
            this.websocket = null;
        }

        this.websocket = new WebSocket(`ws://${this.addr}/fieldsets/1`, {
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
            await this._handleEvent(data);
            // console.log(data);
        });
    }

    /**
     * Handles an event from the TM server (recieved via websockets).
     */
    async _handleEvent(event){
        if (event.type == "fieldMatchAssigned"){
            let match_info = await this.getMatchTeams(event.name);
            this.onMatchQueueCallback(match_info);
        }
        // there are various other event types too, but for now we only care about fieldMatchAssigned
    }

    /**
     * Sets the callback to be executed when a match is queued.
     * 
     */
    async onMatchQueue(callback){
        this.onMatchQueueCallback = callback;
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

        if (this.program == "VRC"){
            return await {
                match_num: match_num,
                program: "VRC",
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
        return team;
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