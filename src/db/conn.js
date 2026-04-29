const mongoose = require("mongoose");
const readline = require("readline/promises");

let selectedDatabase = null;

const DATABASE_CHOICES = {
    local: {
        label: "local MongoDB",
        uri: () => process.env.LOCAL_MONGODB_URI || "mongodb://localhost:27017/taskify"
    },
    cloud: {
        label: "MongoDB Atlas",
        uri: () => process.env.CLOUD_MONGODB_URI
    }
};

function normalizeChoice(choice) {
    const normalized = String(choice || "").trim().toLowerCase();

    if (normalized === "1" || normalized === "local") {
        return "local";
    }

    if (normalized === "2" || normalized === "cloud" || normalized === "atlas") {
        return "cloud";
    }

    return null;
}

async function promptDatabaseChoice() {
    const envChoice = normalizeChoice(process.env.DB_SOURCE || process.env.DATABASE_SOURCE);
    if (envChoice) {
        return envChoice;
    }

    if (!process.stdin.isTTY) {
        return process.env.CLOUD_MONGODB_URI ? "cloud" : "local";
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        while (true) {
            console.log("\nSelect database connection:");
            console.log("1. Local MongoDB");
            console.log("2. MongoDB Atlas");

            const answer = await rl.question("Enter 1 or 2: ");
            const choice = normalizeChoice(answer);

            if (choice) {
                return choice;
            }

            console.log("Invalid choice. Please enter 1 or 2.");
        }
    } finally {
        rl.close();
    }
}

async function configureDatabaseUri() {
    if (selectedDatabase) {
        return selectedDatabase;
    }

    const choice = await promptDatabaseChoice();
    const database = DATABASE_CHOICES[choice];
    const uri = database.uri();

    if (!uri) {
        throw new Error(`Missing ${choice} database URI in environment variables.`);
    }

    process.env.MONGODB_URI = uri;
    process.env.MONGO_URI = uri;

    selectedDatabase = {
        choice,
        label: database.label,
        uri
    };

    console.log(`Using ${database.label}`);
    return selectedDatabase;
}

async function connectDatabase() {
    const database = await configureDatabaseUri();
    await mongoose.connect(database.uri);
    console.log(`MongoDB connected (${database.label})`);
}

module.exports = {
    configureDatabaseUri,
    connectDatabase
};
