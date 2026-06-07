import { customAlphabet } from "nanoid";

// 紛らわしい文字 (0 O 1 l I) を除外したカスタムアルファベット。
// 連番・UUIDを避け、URLで配っても読み間違えにくい10文字IDを生成する。
const ALPHABET =
  "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

/** 共有用ID（10文字）を生成 */
export const newShareId = customAlphabet(ALPHABET, 10);
