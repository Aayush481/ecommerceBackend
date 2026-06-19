import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Product, { IProduct } from './models/product.model';

dotenv.config();

const sampleProducts: Partial<IProduct>[] = [
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
      description: 'Questa splendida tunica in pura seta di Varanasi unisce la maestria degli artigiani indiani con un taglio fluido ed elegante, perfetto per le occasioni speciali in Italia. Dettagli in ricamo dorato lungo la scollatura.',
      tags: ['seta', 'elegante', 'cerimonia', 'kurtis']
    },
    en: {
      name: 'Varanasi Silk Ethnic Kurti',
      description: 'This gorgeous pure Varanasi silk tunic combines Indian artisanal craftsmanship with a fluid, elegant silhouette, perfect for special occasions. Detailed gold embroidery along the neckline.',
      tags: ['silk', 'elegant', 'occasion', 'kurtis']
    }
  },
  {
    sku: 'OP-LND-002',
    price: 119.99,
    category: 'onepiece',
    materials: ['Linen', 'Bamboo Viscose'],
    sizes: ['S', 'M', 'L'],
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 12,
    featured: true,
    it: {
      name: 'Abito Intero Elegante in Lino',
      description: 'Un abito monopezzo moderno e fresco che fonde l\'eleganza del drappeggio indiano con il minimalismo geometrico italiano. Realizzato in lino premium, ideale per eventi all\'aperto e cocktail serali.',
      tags: ['lino', 'onepiece', 'abito', 'elegante']
    },
    en: {
      name: 'Elegant One-Piece Linen Dress',
      description: 'A modern one-piece dress fusing the elegance of Indian drapery with modern Italian geometric minimalism. Made from premium fresh linen, ideal for outdoor events and evening cocktails.',
      tags: ['linen', 'onepiece', 'dress', 'elegant']
    }
  },
  {
    sku: 'SD-JAI-003',
    price: 64.99,
    category: 'summer-dresses',
    materials: ['Cotton', 'Mulmul'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 22,
    featured: true,
    it: {
      name: 'Vestito Estivo in Cotone di Jaipur',
      description: 'Leggero e traspirante, questo abito estivo in cotone Mulmul presenta tradizionali stampe a blocco fatte a mano da Jaipur. Perfetto per le calde giornate estive mediterranee.',
      tags: ['cotone', 'stampato', 'estate', 'abito']
    },
    en: {
      name: 'Jaipur Cotton Summer Dress',
      description: 'Lightweight and highly breathable, this summer dress made of Mulmul cotton features traditional hand-block prints from Jaipur. Ideal for the Mediterranean summer.',
      tags: ['cotton', 'printed', 'summer', 'dress']
    }
  },
  {
    sku: 'IW-FUS-004',
    price: 49.99,
    category: 'indo-western',
    materials: ['Khadi Cotton'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 30,
    featured: true,
    it: {
      name: 'Tunica Indo-Western in Cotone Khadi',
      description: 'Perfetta fusione tra linee casual occidentali e filati Khadi tradizionali. Questa tunica indo-western offre un taglio asimmetrico moderno e una traspirabilità ineguagliabile.',
      tags: ['cotone', 'khadi', 'fusion', 'indo-western']
    },
    en: {
      name: 'Indo-Western Khadi Cotton Tunic',
      description: 'A perfect fusion between casual Western lines and traditional handspun Khadi fibers. This indo-western tunic offers a modern asymmetrical cut and unmatched breathability.',
      tags: ['cotton', 'khadi', 'fusion', 'indo-western']
    }
  },
  {
    sku: 'JW-OXD-005',
    price: 34.99,
    category: 'jewelry-oxidized',
    materials: ['Oxidized Silver Alloy'],
    sizes: ['One Size'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 50,
    featured: true,
    it: {
      name: 'Girocollo Mandala in Argento Ossido',
      description: 'Girocollo artigianale in argento ossidato con dettagliato motivo Mandala tradizionale. Un pezzo d\'effetto che dona un fascino etnico-chic ad ogni look moderno.',
      tags: ['argento', 'ossidato', 'collana', 'gioielli']
    },
    en: {
      name: 'Oxidized Silver Mandala Choker',
      description: 'Artisanal oxidized silver choker featuring a traditional Mandala motif. A statement piece that adds a boho-chic touch to any modern or classic outfit.',
      tags: ['silver', 'oxidized', 'necklace', 'jewelry']
    }
  },
  {
    sku: 'JW-JHU-006',
    price: 24.99,
    category: 'jewelry-earrings',
    materials: ['Oxidized Silver', 'Beads'],
    sizes: ['One Size'],
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 40,
    featured: false,
    it: {
      name: 'Orecchini Jhumka Etnici Pendenti',
      description: 'Orecchini tradizionali a campana in metallo ossidato anticato indiano. Decorati con piccole perline d\'argento e incisioni dettagliate.',
      tags: ['orecchini', 'jhumka', 'ossidato', 'gioielli']
    },
    en: {
      name: 'Oxidized Ethnic Jhumka Earrings',
      description: 'Traditional bell-shaped earrings in antique-finished oxidized metal. Adorned with delicate silver beads and detailed engraving.',
      tags: ['earrings', 'jhumka', 'oxidized', 'jewelry']
    }
  },
  {
    sku: 'BAG-JAI-007',
    price: 45.00,
    category: 'handbags',
    materials: ['Organic Cotton Canvas', 'Mirror Embroidery'],
    sizes: ['One Size'],
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 20,
    featured: true,
    it: {
      name: 'Borsa a Mano Jaipur Ricamata',
      description: 'Borsa a mano colorata e ricamata con piccoli specchi tradizionali di Jaipur. Un accessorio unico rifinito nei minimi dettagli per un tocco bohémien.',
      tags: ['borsa', 'ricamo', 'specchi', 'accessori']
    },
    en: {
      name: 'Jaipur Embroidered Handbag',
      description: 'Colorful handbag embellished with traditional mirror embroidery from Jaipur. A unique accessory finished with delicate details for a bohemian touch.',
      tags: ['bag', 'embroidery', 'mirror', 'accessories']
    }
  },

  {
    sku: 'JW-ANK-010',
    price: 29.99,
    category: 'jewelry-anklets',
    materials: ['Sterling Silver', 'Beads'],
    sizes: ['One Size'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 25,
    featured: false,
    it: {
      name: 'Cavigliera Etnica in Argento Ossidato',
      description: 'Elegante cavigliera regolabile con piccoli campanellini tradizionali indiani payal. Lavorata a mano.',
      tags: ['cavigliera', 'argento', 'etnico', 'gioielli']
    },
    en: {
      name: 'Oxidized Silver Ethnic Anklet',
      description: 'Elegant adjustable handcrafted anklet featuring tiny traditional chime bells.',
      tags: ['anklet', 'silver', 'ethnic', 'jewelry']
    }
  },

  {
    sku: 'JW-BRC-012',
    price: 19.99,
    category: 'jewelry-bracelets',
    materials: ['Sterling Silver', 'Amethyst Beads'],
    sizes: ['One Size'],
    images: [
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 35,
    featured: false,
    it: {
      name: 'Bracciale in Perline d\'Argento e Ametista',
      description: 'Braccialetto elastico composto da perline in argento sterling 925 e autentiche gemme di ametista naturale. Un tocco di raffinato colore quotidiano.',
      tags: ['braccialetto', 'argento', 'ametista', 'gioielli']
    },
    en: {
      name: 'Silver Beaded Amethyst Bracelet',
      description: 'Elastic beaded bracelet made of 925 sterling silver beads and authentic natural amethyst gemstones. A touch of refined everyday color.',
      tags: ['bracelet', 'silver', 'amethyst', 'jewelry']
    }
  },
  {
    sku: 'JW-NEC-013',
    price: 45.00,
    category: 'jewelry-necklace',
    materials: ['Brass Alloy', 'Red Ruby Stones'],
    sizes: ['One Size'],
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 20,
    featured: false,
    it: {
      name: 'Collana Etnica Temple Border',
      description: 'Collana d\'ispirazione Temple indiana con incisioni divine e pietre sintetiche color rubino. Perfetta per arricchire una scollatura elegante.',
      tags: ['collana', 'temple', 'rubino', 'gioielli']
    },
    en: {
      name: 'Temple Border Heritage Necklace',
      description: 'Indian temple-border style necklace featuring intricate heritage engravings and red ruby-colored glass stones. Perfect for elevating an elegant neckline.',
      tags: ['necklace', 'temple', 'ruby', 'jewelry']
    }
  }
];

async function seed() {
  const mongoURI = process.env.MONGODB_URI || '';
  
  // Write to fallback JSON file first to ensure availability
  const fallbackPath = path.join(__dirname, 'fallback_db.json');
  fs.writeFileSync(fallbackPath, JSON.stringify(sampleProducts, null, 2));
  console.log(`[Seed] Fallback file written successfully to: ${fallbackPath}`);

  if (!mongoURI) {
    console.log('[Seed] MONGODB_URI not set. Seeding finished in fallback-only mode.');
    return;
  }

  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected. Cleaning existing products...');
    await Product.deleteMany({});
    
    console.log('[Seed] Inserting sample products...');
    await Product.insertMany(sampleProducts);
    
    console.log('[Seed] Database seeded successfully!');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

seed();
