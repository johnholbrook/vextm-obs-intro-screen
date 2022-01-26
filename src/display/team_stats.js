/**
 * @file team_stats.js
 * @brief Provides a pure static class to get various team stats
 * @author John Holbrook
 */

const axios = require('axios');

module.exports = class TeamStats{
    /**
     * @brief Constructor
     */
     constructor() {
        throw new Error('This is a static class');
    }

    /**
     * @brief Make a request to a URL and return the response
     * @param {String} url
     */
    static async _makeRequest(url) {
        let response = await axios.get(url);
        return response.data;
    }

    /**
     * @brief Get stats for a VRC team from vrc-data-analysis.com
     * @param {String} team - team number (e.g. 1234A)
     */
    static async VRCTeamStats(team){
        let url = `http://api.vexstreams.com/team/VRC/${team}`;

        try{
            let response = await this._makeRequest(url);
            return response;
        }
        catch (err){
            return {
                "avg_ap": "N/A",
                "awp_rate": "N/A",
                "record": "N/A"
            }
        }
    }

    /**
     * @brief Get stats for a RADC team from api.vexstreams.com (frontend to RobotEvents API)
     * @param {String} team - team number (e.g. 1234A)
     */
    static async RADCTeamStats(team){
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
    static async VIQCTeamStats(team){
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
    static async AddTeamStats(match){
        if (match.program == "VRC"){
            match.blue_1.stats = await this.VRCTeamStats(match.blue_1.number);
            match.blue_2.stats = await this.VRCTeamStats(match.blue_2.number);
            match.red_1.stats = await this.VRCTeamStats(match.red_1.number);
            match.red_2.stats = await this.VRCTeamStats(match.red_2.number);
            return match;
        }
        else if (match.program == "RADC"){
            match.blue_1.stats = await this.RADCTeamStats(match.blue_1.number);
            match.blue_2.stats = await this.RADCTeamStats(match.blue_2.number);
            match.red_1.stats = await this.RADCTeamStats(match.red_1.number);
            match.red_2.stats = await this.RADCTeamStats(match.red_2.number);
            return match;
        }
        else if (match.program == "VIQC"){
            match.team_1.stats = await this.VIQCTeamStats(match.team_1.number);
            match.team_2.stats = await this.VIQCTeamStats(match.team_2.number);
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