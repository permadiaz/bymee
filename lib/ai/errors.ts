export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus = 502,
  ) {
    super(message);
    this.name = "AIError";
  }
}

// Inspect provider details only for classification. Never expose raw responses,
// which can echo API keys, submitted customer context, or internal URLs.
export async function providerError(response: Response): Promise<AIError> {
  let detail = "";
  try {
    detail = JSON.stringify(await response.json()).toLowerCase();
  } catch {
    /* non-JSON upstream error */
  }
  const status = response.status;
  if (
    status === 401 ||
    /api_key_invalid|api key not valid|invalid api key|invalid_api_key/.test(
      detail,
    )
  )
    return new AIError(
      "API key AI ditolak. Periksa AI_API_KEY di Vercel (Production), lalu redeploy.",
      "AI_KEY_INVALID",
    );
  if (status === 403)
    return new AIError(
      "Akses provider AI ditolak. Periksa izin API key, pembatasan key, dan akses model pada project provider.",
      "AI_ACCESS_DENIED",
    );
  if (
    status === 404 ||
    /model_not_found|model.*not found|model.*not supported/.test(detail)
  )
    return new AIError(
      "Model atau endpoint AI tidak ditemukan. Periksa AI_MODEL dan AI_BASE_URL di Vercel, lalu redeploy.",
      "AI_MODEL_NOT_FOUND",
    );
  if (status === 429)
    return new AIError(
      "Kuota atau rate limit provider AI tercapai. Periksa quota dan billing project API; jika batas sementara, tunggu sebelum mencoba lagi.",
      "AI_PROVIDER_QUOTA",
      429,
    );
  if (status === 400 || status === 422)
    return new AIError(
      "Provider menolak format atau konfigurasi request AI. Pastikan endpoint dan model mendukung chat completions serta JSON output.",
      "AI_REQUEST_REJECTED",
    );
  if (status >= 500)
    return new AIError(
      "Provider AI sedang mengalami gangguan. Coba lagi nanti.",
      "AI_PROVIDER_UNAVAILABLE",
      503,
    );
  return new AIError(
    "Request ke provider AI gagal. Periksa konfigurasi provider pada deployment ini.",
    "AI_PROVIDER_ERROR",
  );
}
