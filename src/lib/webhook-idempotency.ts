type MetadataShape = {
  eventType?: string;
  mode?: string;
  events?: string[];
  lastEventId?: string;
  [key: string]: unknown;
};

export function parsePaymentMetadata(metadataJson: string | null): MetadataShape {
  if (!metadataJson) return {};

  try {
    const parsed = JSON.parse(metadataJson) as MetadataShape;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function isDuplicateWebhookEvent(metadataJson: string | null, eventId: string) {
  const metadata = parsePaymentMetadata(metadataJson);
  const events = Array.isArray(metadata.events) ? metadata.events : [];
  return events.includes(eventId) || metadata.lastEventId === eventId;
}

export function buildWebhookMetadata(
  metadataJson: string | null,
  eventId: string,
  eventType: string,
  extra?: Record<string, unknown>,
) {
  const metadata = parsePaymentMetadata(metadataJson);
  const events = Array.isArray(metadata.events) ? metadata.events : [];
  const nextEvents = [...new Set([...events, eventId])].slice(-20);

  return JSON.stringify({
    ...metadata,
    ...extra,
    eventType,
    lastEventId: eventId,
    events: nextEvents,
    processedAt: new Date().toISOString(),
  });
}
