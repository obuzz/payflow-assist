from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
import stripe
from app.core.config import settings
from app.core.database import get_db
from app.models.business import Business, SubscriptionStatus

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle subscription events
    if event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        await handle_subscription_update(subscription, db)

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await handle_subscription_deleted(subscription, db)

    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        await handle_payment_failed(invoice, db)

    return {"status": "success"}


async def handle_subscription_update(subscription: dict, db: Session):
    """Update business subscription status"""
    customer_id = subscription['customer']
    status = subscription['status']

    # Find business by Stripe customer ID
    # Note: You'll need to add stripe_customer_id field to Business model
    business = db.query(Business).filter(
        Business.stripe_customer_id == customer_id
    ).first()

    if business:
        if status == 'active':
            business.subscription_status = SubscriptionStatus.ACTIVE
        elif status in ['past_due', 'unpaid']:
            business.subscription_status = SubscriptionStatus.PAST_DUE
        elif status in ['canceled', 'incomplete_expired']:
            business.subscription_status = SubscriptionStatus.CANCELLED

        db.commit()


async def handle_subscription_deleted(subscription: dict, db: Session):
    """Handle subscription cancellation"""
    customer_id = subscription['customer']

    business = db.query(Business).filter(
        Business.stripe_customer_id == customer_id
    ).first()

    if business:
        business.subscription_status = SubscriptionStatus.CANCELLED
        db.commit()


async def handle_payment_failed(invoice: dict, db: Session):
    """Handle failed payment"""
    customer_id = invoice['customer']

    business = db.query(Business).filter(
        Business.stripe_customer_id == customer_id
    ).first()

    if business:
        business.subscription_status = SubscriptionStatus.PAST_DUE
        db.commit()
