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
        let url = `http://vrc-data-analysis.com/v1/team/${team}`;

        try{
            let response = await this._makeRequest(url);
            return {
                "avg_ap": response.ap_per_match ? response.ap_per_match : "N/A",
                "awp_rate": response.awp_per_match ? `${response.awp_per_match*100}%` : "N/A",
                "ccwm": response.ccwm ? response.ccwm : "N/A"
            }
        }
        catch(err){
            return {
                "avg_ap": "N/A",
                "awp_rate": "N/A",
                "ccwm": "N/A"
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
        else{
            return match;
        }
    }
}