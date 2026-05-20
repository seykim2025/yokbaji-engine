// E-05: Standardized error response types

export type EngineErrorCode =
  | "FACE_NOT_DETECTED"
  | "FACE_TOO_SMALL"
  | "FACE_TOO_BLURRY"
  | "MULTIPLE_FACES_DETECTED"
  | "UNSUPPORTED_IMAGE"
  | "EXTERNAL_API_FAILED"
  | "GENERATION_TIMEOUT"
  | "ASSET_SAVE_FAILED"
  | "DIALOGUE_GENERATION_FAILED"
  | "UNKNOWN_ERROR";

export interface EngineErrorBody {
  ok: false;
  error_code: EngineErrorCode;
  message: string;
  chargeable: boolean;
}

export class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
    public readonly chargeable = false
  ) {
    super(message);
    this.name = "EngineError";
  }

  toResponse(): EngineErrorBody {
    return { ok: false, error_code: this.code, message: this.message, chargeable: this.chargeable };
  }
}

export const ERROR_MESSAGES: Record<EngineErrorCode, string> = {
  FACE_NOT_DETECTED:          "얼굴을 찾지 못했습니다. 정면 얼굴이 잘 보이는 사진으로 다시 시도해 주세요.",
  FACE_TOO_SMALL:             "얼굴이 너무 작습니다. 얼굴이 더 크게 나온 사진으로 다시 시도해 주세요.",
  FACE_TOO_BLURRY:            "이미지가 너무 흐립니다. 더 선명한 사진으로 다시 시도해 주세요.",
  MULTIPLE_FACES_DETECTED:    "여러 명의 얼굴이 감지됐습니다. 한 명의 얼굴만 있는 사진으로 다시 시도해 주세요.",
  UNSUPPORTED_IMAGE:          "지원하지 않는 이미지 형식입니다. JPG 또는 PNG 파일을 사용해 주세요.",
  EXTERNAL_API_FAILED:        "반응 생성 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
  GENERATION_TIMEOUT:         "반응 생성 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
  ASSET_SAVE_FAILED:          "결과 저장 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
  DIALOGUE_GENERATION_FAILED: "대사 생성 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
  UNKNOWN_ERROR:              "알 수 없는 문제가 발생했습니다. 다시 시도해 주세요.",
};
