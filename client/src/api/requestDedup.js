const inFlightRequests = new Map();

export function dedupeRequest(key, request) {
  const existingRequest = inFlightRequests.get(key);
  if (existingRequest) return existingRequest;

  const pendingRequest = Promise.resolve().then(request);
  inFlightRequests.set(key, pendingRequest);

  const clearRequest = () => {
    if (inFlightRequests.get(key) === pendingRequest) {
      inFlightRequests.delete(key);
    }
  };
  pendingRequest.then(clearRequest, clearRequest);

  return pendingRequest;
}
