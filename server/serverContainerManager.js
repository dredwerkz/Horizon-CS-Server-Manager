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
    getServerData(serverKey) {
        const responseObject = [
            {
                serverkey: [serverKey],
                ct: this.serverContainer[serverKey]["CT"],
                terrorist: this.serverContainer[serverKey]["TERRORIST"],
                map: this.serverContainer[serverKey]["map"],
                rounds: this.serverContainer[serverKey]["rounds"],
                admin: this.serverContainer[serverKey]["admin"]
            },
        ];
        return responseObject || null;
    }

    // Method to get all data
    getAllData() {
        return this.serverContainer;
    }

    // Additional methods as needed for managing the state
}

export default ServerContainerManager;
