// Test the real browser library and its WASM assets, without making a network connection.
window.prepareRealTransport = async () => {
  const { createTransport } = await import('real-auth-transport');
  const transport = await createTransport({ apiId: 123456, apiHash: '0123456789abcdef0123456789abcdef' });
  try { await transport.prepare(); return true; }
  finally { await transport.close(); }
};
