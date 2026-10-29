import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
    );
}


const cached = global.mongoose ?? (global.mongoose = { conn: null, promise: null });

export async function connectToDatabase(): Promise<Connection> {
    // 1. If connection is already established, return it immediately
    if (cached.conn) {
        return cached.conn;
    }

    // 2. If no connection attempt is in-flight, initiate a new one
    if (!cached.promise) {
        const opts = {
            bufferCommands: true,
            maxPoolSize: 10,
        };

        cached.promise = mongoose
            .connect(MONGODB_URI as string, opts)
            .then(() => mongoose.connection);
    }

    // 3. Await the pending connection promise and cache the result
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        // If connection fails, clear promise so the next request can retry
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}

