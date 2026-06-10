"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const product_model_1 = __importDefault(require("./models/product.model"));
dotenv_1.default.config();
const sampleProducts = [
    {
        sku: 'KUR-VAR-001',
        price: 89.99,
        category: 'kurtis',
        materials: ['Varanasi Silk', 'Zari Thread'],
        sizes: ['S', 'M', 'L', 'XL'],
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
        ],
        stock: 15,
        featured: true,
        it: {
            name: 'Kurti Etnica in Seta di Varanasi',
            description: 'Questa splendida tunica in pura seta di Varanasi unisce la maestria degli artigiani indiani con un taglio fluido ed elegante, perfetto per le occasioni speciali. Dettagli in ricamo dorato lungo la scollatura.',
            tags: ['seta', 'elegante', 'cerimonia', 'kurtis']
        },
        en: {
            name: 'Varanasi Silk Ethnic Kurti',
            description: 'This gorgeous pure Varanasi silk tunic combines Indian artisanal craftsmanship with a fluid, elegant silhouette, perfect for special occasions. Detailed gold embroidery along the neckline.',
            tags: ['silk', 'elegant', 'occasion', 'kurtis']
        }
    },
    {
        sku: 'DW-KHA-002',
        price: 49.99,
        category: 'dailywear',
        materials: ['Khadi Cotton'],
        sizes: ['S', 'M', 'L', 'XL'],
        images: [
            'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=800'
        ],
        stock: 30,
        featured: true,
        it: {
            name: 'Tunica Quotidiana in Cotone Khadi',
            description: 'Ideale per le calde giornate estive in Italia, questa tunica traspirante in 100% cotone Khadi filato a mano offre un comfort ineguagliabile e uno stile casual-chic minimalista.',
            tags: ['cotone', 'khadi', 'comodo', 'estate', 'dailywear']
        },
        en: {
            name: 'Khadi Cotton Daily Tunic',
            description: 'Ideal for hot summer days, this breathable tunic made of 100% handspun Khadi cotton offers unmatched comfort and a minimalist casual-chic style.',
            tags: ['cotton', 'khadi', 'comfortable', 'summer', 'dailywear']
        }
    },
    {
        sku: 'MOD-FUS-003',
        price: 119.99,
        category: 'modern',
        materials: ['Linen', 'Bamboo Viscose'],
        sizes: ['S', 'M', 'L'],
        images: [
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'
        ],
        stock: 12,
        featured: true,
        it: {
            name: 'Abito Fusion Contemporaneo in Lino',
            description: 'Un design moderno che fonde l\'eleganza del drappeggio indiano con il minimalismo geometrico italiano. Realizzato in fresco lino premium, ideale per eventi all\'aperto e cocktail serali.',
            tags: ['lino', 'fusion', 'minimalista', 'moderno']
        },
        en: {
            name: 'Modern Fusion Linen Dress',
            description: 'A modern design fusing the elegance of Indian drapery with modern Italian geometric minimalism. Made from premium fresh linen, ideal for outdoor events and evening cocktails.',
            tags: ['linen', 'fusion', 'minimalist', 'modern']
        }
    },
    {
        sku: 'JW-MAN-004',
        price: 34.99,
        category: 'jewelry',
        materials: ['Oxidized Silver Alloy'],
        sizes: ['One Size'],
        images: [
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'
        ],
        stock: 50,
        featured: true,
        it: {
            name: 'Collana Ossidata Mandala Choker',
            description: 'Girocollo artigianale in argento ossidato con motivo Mandala tradizionale. Un pezzo d\'effetto che dona un tocco boho-chic a qualsiasi outfit moderno o classico.',
            tags: ['argento', 'ossidato', 'collana', 'boho', 'gioielli']
        },
        en: {
            name: 'Oxidized Mandala Choker',
            description: 'Artisanal oxidized silver choker featuring a traditional Mandala motif. A statement piece that adds a boho-chic touch to any modern or classic outfit.',
            tags: ['silver', 'oxidized', 'necklace', 'boho', 'jewelry']
        }
    },
    {
        sku: 'JW-JHU-005',
        price: 24.99,
        category: 'jewelry',
        materials: ['Oxidized Silver', 'Beads'],
        sizes: ['One Size'],
        images: [
            'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800'
        ],
        stock: 40,
        featured: false,
        it: {
            name: 'Orecchini Pendenti Jhumka Ossidati',
            description: 'Orecchini tradizionali a campana in metallo ossidato anticato. Decorati con piccole perline d\'argento e incisioni dettagliate, ideali da abbinare a kurtis o abiti minimalisti.',
            tags: ['orecchini', 'jhumka', 'ossidato', 'boho', 'gioielli']
        },
        en: {
            name: 'Oxidized Ethnic Jhumka Earrings',
            description: 'Traditional bell-shaped earrings in antique-finished oxidized metal. Adorned with delicate silver beads and detailed engraving, perfect to pair with kurtis or minimalist dresses.',
            tags: ['earrings', 'jhumka', 'oxidized', 'boho', 'jewelry']
        }
    },
    {
        sku: 'KUR-COT-006',
        price: 64.99,
        category: 'kurtis',
        materials: ['Cotton', 'Mulmul'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        images: [
            'https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&q=80&w=800'
        ],
        stock: 22,
        featured: false,
        it: {
            name: 'Kurti Estivo in Cotone Stampato',
            description: 'Leggero e traspirante, questo kurti in cotone Mulmul presenta tradizionali stampe a blocco fatte a mano da Jaipur. Ideale per l\'estate mediterranea.',
            tags: ['cotone', 'stampato', 'estate', 'kurtis']
        },
        en: {
            name: 'Summer Block-Printed Cotton Kurti',
            description: 'Lightweight and highly breathable, this Mulmul cotton kurti features traditional hand-block prints from Jaipur. Ideal for the Mediterranean summer.',
            tags: ['cotton', 'printed', 'summer', 'kurtis']
        }
    }
];
async function seed() {
    const mongoURI = process.env.MONGODB_URI || '';
    // Write to fallback JSON file first to ensure availability
    const fallbackPath = path_1.default.join(__dirname, 'fallback_db.json');
    fs_1.default.writeFileSync(fallbackPath, JSON.stringify(sampleProducts, null, 2));
    console.log(`[Seed] Fallback file written successfully to: ${fallbackPath}`);
    if (!mongoURI) {
        console.log('[Seed] MONGODB_URI not set. Seeding finished in fallback-only mode.');
        return;
    }
    try {
        console.log('[Seed] Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoURI);
        console.log('[Seed] Connected. Cleaning existing products...');
        await product_model_1.default.deleteMany({});
        console.log('[Seed] Inserting sample products...');
        await product_model_1.default.insertMany(sampleProducts);
        console.log('[Seed] Database seeded successfully!');
    }
    catch (error) {
        console.error('[Seed] Error seeding database:', error);
    }
    finally {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
        }
    }
}
seed();
