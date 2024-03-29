export function sendMessage(from, message, uri) {
    return fetch(`${uri}/message`, {
      method: "POST",
      body: JSON.stringify({
        from: from,
        message: message,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
  }
  