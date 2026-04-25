import stripe
import os
from dotenv import load_dotenv

# Load from .env.local for Next.js consistency
load_dotenv(".env.local")

STRIPE_API_KEY = os.getenv("STRIPE_SECRET_KEY")
stripe.api_key = STRIPE_API_KEY

plans = [
    {
        "id": "plan-2-especialistas",
        "name": "Odonto Connect - 2 Especialistas",
        "price_brl": 147,
        "description": "Ideal para consultórios individuais.",
        "features": ["Agenda Inteligente", "Confirmação WhatsApp", "Prontuário Digital"]
    },
    {
        "id": "plan-3-5-especialistas",
        "name": "Odonto Connect - 3 a 5 Especialistas",
        "price_brl": 257,
        "description": "Ideal para clínicas em crescimento.",
        "features": ["Tudo do Essencial", "Gestão de Equipe", "Relatórios Financeiros"]
    },
    {
        "id": "plan-5-8-especialistas",
        "name": "Odonto Connect - 5 a 8 Especialistas",
        "price_brl": 367,
        "description": "Para clínicas de alto volume.",
        "features": ["Tudo do Profissional", "Automação de Marketing", "Suporte Prioritário"]
    }
]

def setup_stripe():
    print("🦷 Configurando Stripe para Odonto Connect...")
    
    for plan in plans:
        try:
            product = stripe.Product.create(
                name=plan["name"],
                description=plan["description"],
                metadata={"plan_slug": plan["id"]}
            )
            
            price = stripe.Price.create(
                product=product.id,
                unit_amount=int(plan["price_brl"] * 100),
                currency="brl",
                recurring={"interval": "month"}
            )
            
            print(f"✅ {plan['name']} -> Price ID: {price.id}")
            
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    setup_stripe()
