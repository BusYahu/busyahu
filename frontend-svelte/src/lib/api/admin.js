export function createAdminApi(request) {
  async function createTrain(payload) {
    const result = await request('/trains', {
      method: 'POST',
      body: payload,
      normalize: (raw) => raw ?? {},
    });
    return result.data;
  }

  return { createTrain };
}
