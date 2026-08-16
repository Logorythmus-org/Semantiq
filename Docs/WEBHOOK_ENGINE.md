# Webhook Engine

The Webhook Engine handles incoming and outgoing webhook traffic.

## Capabilities
- incoming webhooks
- outgoing webhooks
- retries
- verification
- filtering
- transformation
- replay
- signing
- audit
- versioning

## Delivery
Webhook events are translated into internal messages or domain events through the gateway. Failed deliveries enter a dead-letter queue with replay support.
