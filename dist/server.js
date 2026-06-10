"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const api_routes_1 = __importDefault(require("./routes/api.routes"));
const product_model_1 = __importDefault(require("./models/product.model"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS for frontend development
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
// Serve uploaded images statically
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public/uploads')));
// Main API mounting
app.use('/api', api_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: mongoose_1.default.connection.readyState === 1 ? 'mongodb' : 'json-fallback',
        time: new Date().toISOString()
    });
});
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    console.log('[Server] Connecting to MongoDB at:', mongoURI.replace(/:[^@]+@/, ':***@')); // Hide credentials
    mongoose_1.default.connect(mongoURI)
        .then(async () => {
        console.log('[Server] MongoDB connection established.');
        // Auto-seed empty database in production
        try {
            const count = await product_model_1.default.countDocuments();
            if (count === 0) {
                console.log('[Server] Connected MongoDB database is empty. Autoseeding catalog...');
                const fallbackPath = path_1.default.join(__dirname, 'fallback_db.json');
                if (fs_1.default.existsSync(fallbackPath)) {
                    const raw = fs_1.default.readFileSync(fallbackPath, 'utf-8');
                    const data = JSON.parse(raw);
                    await product_model_1.default.insertMany(data);
                    console.log(`[Server] Database successfully auto-seeded with ${data.length} products!`);
                }
                else {
                    console.warn('[Server] Auto-seed failed: fallback_db.json not found at:', fallbackPath);
                }
            }
        }
        catch (err) {
            console.error('[Server] Autoseeding check error:', err);
        }
    })
        .catch((err) => {
        console.error('[Server] MongoDB connection failed:', err);
        console.log('[Server] Falling back to JSON database files.');
    });
}
else {
    console.log('[Server] MONGODB_URI not provided. Running with Local JSON file fallback.');
}
app.listen(PORT, () => {
    console.log(`[Server] Express server running on port ${PORT}`);
});
