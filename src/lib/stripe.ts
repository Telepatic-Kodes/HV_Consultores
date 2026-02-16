import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  free: {
    name: "Gratis",
    price: 0,
    priceId: null,
    description: "Para empezar a explorar",
    features: [
      "1 cliente",
      "Clasificación básica de documentos",
      "Cálculo F29 manual",
      "Chat IA (10 consultas/mes)",
      "Soporte por email",
    ],
    limits: { maxClients: 1, maxBotRuns: 10 },
  },
  pro: {
    name: "Pro",
    price: 50,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    description: "Para estudios contables en crecimiento",
    features: [
      "Hasta 20 clientes",
      "Clasificación IA avanzada",
      "F29 automatizado + validaciones",
      "Bots RPA (SII, Previred, AFC)",
      "Chat IA ilimitado",
      "Conciliación bancaria",
      "Reportes ejecutivos",
      "Soporte prioritario",
    ],
    limits: { maxClients: 20, maxBotRuns: 500 },
    popular: true,
  },
  enterprise: {
    name: "Enterprise",
    price: 150,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    description: "Para estudios contables consolidados",
    features: [
      "Clientes ilimitados",
      "Todo lo de Pro",
      "Bots RPA personalizados",
      "Pipeline de conciliación automática",
      "Alertas de anomalías con IA",
      "Analytics avanzados",
      "API access",
      "Soporte dedicado 24/7",
      "Onboarding personalizado",
    ],
    limits: { maxClients: 999999, maxBotRuns: 999999 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
