/**
 * @file vrc_match_predictor.js
 * @brief Provides a pure static class to predict the outcome of a VRC match, using data from vrc-data-analysis.com
 * @author John Holbrook
 */

const axios = require('axios');

module.exports = class VRCMatchPredictor {
    /**
     * @brief Constructor
     */
    constructor() {
        throw new Error('This is a static class');
    }

    /**
     * @brief Predict the outcome of a VRC match
     * @param {Object} match object representing the match
     */
    static async predict(match) {
        let red1 = match.red_1.number;
        let red2 = match.red_2.number;
        let blue1 = match.blue_1.number;
        let blue2 = match.blue_2.number;
        let match_prediction = await this._getPrediction(red1, red2, blue1, blue2);
        if (match_prediction.red_win_probability < 0){
            // one or more team numbers are invalid, substitute the average team
            if (!(await this.isValidTeamNumber(red1))) {
                red1 = "AVG";
            }
            if (!(await this.isValidTeamNumber(red2))) {
                red2 = "AVG";
            }
            if (!(await this.isValidTeamNumber(blue1))) {
                blue1 = "AVG";
            }
            if (!(await this.isValidTeamNumber(blue2))) {
                blue2 = "AVG";
            }
            return this._getPrediction(red1, red2, blue1, blue2);
        }
        else {
            return match_prediction;
        }
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
     * @brief Get info about a particular team
     * @param {String} teamNumber
     * @return {Object} or {error: true} if the team number is invalid
     */
    static async getTeamInfo(teamNumber) {
        let url = `http://vrc-data-analysis.com/v1/team/${teamNumber}`;
        try{
            let response = await this._makeRequest(url);
            return response;
        }
        catch(err){
            return {error: true};
        }
    }

    /**
     * @brief Get the predicted result for a particular combination of teams
     * @param {String} red1 team number (or AVG for average team)
     * @param {String} red2 team number (or AVG for average team)
     * @param {String} blue1 team number (or AVG for average team)
     * @param {String} blue2 team number (or AVG for average team)
     */
    static async _getPrediction(red1, red2, blue1, blue2) {
        let url = `http://vrc-data-analysis.com/v1/predict/${red1}/${red2}/${blue1}/${blue2}`;
        let response = await this._makeRequest(url);
        return response;
    }

    /**
     * @brief Return true if a team number is valid (i.e. if the site knows about this team)
     * @param {String} teamNumber
     * @return {Boolean}
     */
    static async isValidTeamNumber(teamNumber) {
        let team_info = await this.getTeamInfo(teamNumber);
        if (team_info.error){
            return false;
        }
        return true;
    }
}