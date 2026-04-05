export { createCharacter, getCharacter, listCharacters } from "./services/character.service";
export { generateReaction } from "./services/reaction.service";
export { loadBaseAssets } from "./lib/asset-selector";
export { generateDialogue } from "./lib/dialogue-generator";
export { buildDialoguePrompt, getFallbackDialogue } from "./prompts/reaction-dialogue.prompts";
export type {
  Gender,
  Personality,
  CharacterMeta,
  BaseAsset,
  ReactionRequest,
  ReactionResult,
  CharacterCreateRequest,
} from "./types";
