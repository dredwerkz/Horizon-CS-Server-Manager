import { getAllServerData } from "./dbHandlers/dbHandlers.js";

class ServerContainerManager {
    constructor() {
        // Initialize your container with default values
        /* this.serverContainer = {}; */
        getAllServerData().then((data) => {
            this.serverContainer = data;
            console.log("DB data loaded into serverContainer");
        });
    }

    // Method to update the server container with new data
    updateServerData(serverKey, newData) {
        // Implement logic to update the server container
        // Adding or updating a server's data
        if (!this.serverContainer[serverKey]) {
            this.serverContainer[serverKey] = {};
        }

        // Merge new data into the existing server data
        this.serverContainer[serverKey] = {
            ...this.serverContainer[serverKey],
            ...newData,
        };
    }

    // Method to retrieve data from a specific server
    // Method to retrieve data from a specific server
    getServerData(serverKey) {
        // Ensure the server data exists
        if (!this.serverContainer[serverKey]) {
            return null; // or some default object structure if you prefer
        }

        const serverData = this.serverContainer[serverKey];
        const responseObject = {
            serverkey: serverKey,
            ct: serverData.CT,
            terrorist: serverData.TERRORIST,
            map: serverData.map,
            rounds: serverData.rounds,
            admin: serverData.admin,
        };

        return responseObject;
    }

    // Method to get all data
    getAllData() {
        return this.serverContainer;
    }

    // Additional methods as needed for managing the state
}

export default ServerContainerManager;
