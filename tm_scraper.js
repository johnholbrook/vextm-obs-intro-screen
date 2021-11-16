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
const { thistle } = require('color-name');

module.exports = class TMScraper {
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
        console.log("Fetching matches...")
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
                match_num: cols[0].textContent,
                red_1: cols[1].textContent,
                red_2: cols[2].textContent,
                blue_1: cols[3].textContent,
                blue_2: cols[4].textContent
            }
        }
        else if (this.program == "VEXU"){
            return {
                match_num: cols[0].textContent,
                red_1: cols[1].textContent,
                blue_1: cols[2].textContent
            }
        }
        else if (this.program == "VIQC"){
            return {
                match_num: cols[0].textContent,
                team_1: cols[1].textContent,
                team_2: cols[2].textContent
            }
        }
    }

    /** 
     * Determines which program is being run (VRC, VIQC, VEXU, etc.)
     */
    async _fetchProgram(){
        console.log("Fetching program...");
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
        this.websocket.on('message', event => {
            let data = JSON.parse(event.toString());
            this._handleEvent(data);
            // console.log(data);
        });
    }

    /**
     * Handles an event from the TM server (recieved via websockets).
     */
    _handleEvent(event){
        if (event.type == "fieldMatchAssigned"){
            this.onMatchQueueCallback(event.name);
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
}