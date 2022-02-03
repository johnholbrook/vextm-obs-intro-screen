/**
 * @file team_stats.js
 * @brief Provides a class to get various team stats
 * @author John Holbrook
 */

const axios = require('axios');

module.exports = class TeamStats{
    /**
     * @brief Constructor
     * @param {String} program - program to fetch stats for ("VRC", "VEXU", "VIQC", or "RADC")
     * @param {Array} teams - list of team numbers
     */
    constructor(program, teams) {
        this.program = program.toUpperCase();
        this.fetchStats = null;
        switch (this.program){
            case "VRC":
                this.fetchStats = this._fetchVRCTeamStats;
                break;
            case "VEXU":
                this.fetchStats = this._fetchVEXUTeamStats;
                break;
            case "VIQC":
                this.fetchStats = this._fetchVIQCTeamStats;
                break;
            case "RADC":
                this.fetchStats = this._fetchRADCTeamStats;
                break;
            default:
                throw new Error("Stats for this program not supported");
        }

        this.teams = teams;
        this.cache = null;
        this.interval = null;
    }

    /**
     * Start periodically fetching stats for all teams
     * @param {Number} interval - Fetch frequency in seconds. Default is 300sec = 5min.
     */
    start(desired_interval=300){
        // console.log("Starting to cache team stats periodically...")

        // if we were already fetching stats, stop
        this.stop();

        let updateFunc = async () => {
            let start_time = new Date();
            let start_time_string = start_time.toLocaleTimeString('en-US', {hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric'});
            console.log(`Fetching team stats at ${start_time_string}...`);
            await asyncForEach(this.teams, async t => {
                let data = await this.fetchStats(t);
                // console.log(`${t}: ${JSON.stringify(data)}`);
                this.cache.set(t, data);
            });
            let end_time = new Date();
            let run_time = round((end_time.valueOf() - start_time.valueOf())/1000, 1); //seconds
            console.log(`Got stats for ${this.teams.length} teams in ${run_time} seconds.`)
        }

        this.cache = new Map();
        this.interval = setInterval(updateFunc, desired_interval * 1000)
        updateFunc();
    }

    /**
     * Stop periodically fetching stats
     */
    stop(){
        clearInterval(this.interval);
        this.cache = null;
    }

    /**
     * Get stats info for a particular team
     * @param {*} team 
     * @returns Stats for the desired team
     */
    async get(team){
        if (this.cache.has(team)){
            // if we have this team in the cache, use that
            return this.cache.get(team);
        }
        // if not, get the stats fresh
        else return this.fetchStats(team); 
    }

    /**
     * @brief Make a request to a URL and return the response
     * @param {String} url
     */
    async _makeRequest(url) {
        let response = await axios.get(url);
        return response.data;
    }

    /**
     * @brief Get stats for a VRC team from api.vexstreams.com (frontend to RobotEvents API)
     * @param {String} team - team number (e.g. 1234A)
     */
    async _fetchVRCTeamStats(team){
        let url = `http://api.vexstreams.com/team/VRC/${team}`;
        // console.log(url);

        try{
            let response = await this._makeRequest(url);
            if (!response.error) return response;
            else return {
                "avg_ap": "N/A",
                "awp_rate": "N/A",
                "record": "N/A",
                "error_msg": response.error 
            }
        }
        catch (err){
            return {
                "avg_ap": "N/A",
                "awp_rate": "N/A",
                "record": "N/A",
                "error_msg": err.message
            }
        }
    }

    /**
     * @brief Get stats for a VEXU team from api.vexstreams.com (frontend to RobotEvents API)
     * @param {String} team - team number (e.g. SQL)
     */
     async _fetchVEXUTeamStats(team){
        let url = `http://api.vexstreams.com/team/VEXU/${team}`;
        // console.log(url);

        try{
            let response = await this._makeRequest(url);
            if (!response.error) return response;
            else return {
                "avg_ap": "N/A",
                "awp_rate": "N/A",
                "record": "N/A",
                "error_msg": response.error 
            }
        }
        catch (err){
            return {
                "avg_ap": "N/A",
                "awp_rate": "N/A",
                "record": "N/A",
                "error_msg": err.message
            }
        }
    }

    /**
     * @brief Get stats for a RADC team from api.vexstreams.com (frontend to RobotEvents API)
     * @param {String} team - team number (e.g. 1234A)
     */
    async _fetchRADCTeamStats(team){
        let url = `http://api.vexstreams.com/team/RADC/${team}`;

        try{
            let response = await this._makeRequest(url);
            return response;
        }
        catch(err){
            return {
                "high_score": "N/A",
                "avg_score": "N/A",
                "max_skills": "N/A"
            }
        }
    }

    /**
     * @brief Get stats for a VRC team from api.vexstreams.com (frontend to RobotEvents API)
     * @param {String} team - team number (e.g. 1234A)
     */
    async _fetchVIQCTeamStats(team){
        let url = `http://api.vexstreams.com/team/VIQC/${team}`;

        try{
            let response = await this._makeRequest(url);
            if (!response.error){
                return response;
            }
            else return {
                "high_score": "N/A",
                "avg_score": "N/A",
                "max_d_skills": "N/A"
            };
        }
        catch(err){
            return {
                "high_score": "N/A",
                "avg_score": "N/A",
                "max_d_skills": "N/A"
            }
        }
    }

    /**
     * Add team stats to a Match object
     * @param {Object} match - Object representing a particular match
     */
    async AddTeamStats(match){
        if (match.program == "VRC"){
            match.blue_1.stats = await this.get(match.blue_1.number);
            match.blue_2.stats = await this.get(match.blue_2.number);
            match.red_1.stats = await this.get(match.red_1.number);
            match.red_2.stats = await this.get(match.red_2.number);
            return match;
        }
        else if (match.program == "RADC"){
            match.blue_1.stats = await this.get(match.blue_1.number);
            match.blue_2.stats = await this.get(match.blue_2.number);
            match.red_1.stats = await this.get(match.red_1.number);
            match.red_2.stats = await this.get(match.red_2.number);
            return match;
        }
        else if (match.program == "VIQC"){
            match.team_1.stats = await this.get(match.team_1.number);
            match.team_2.stats = await this.get(match.team_2.number);
            return match;
        }
        else if (match.program == "VEXU"){
            match.blue_1.stats = await this.get(match.blue_1.number);
            match.red_1.stats = await this.get(match.red_1.number);
            return match;
        }
        else{
            return match;
        }
    }
}

function isNumber(o){
    return typeof o === 'number' && isFinite(o);
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

/**
 * Round a number to the specified number of decimal places
 * @param {Number} num The number to round
 * @param {Number} decimals The number of decimal places to round to
 * @returns {Number} The rounded number
 */
 function round(num, decimals) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}