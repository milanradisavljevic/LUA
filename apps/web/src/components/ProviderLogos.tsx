/**
 * Inline SVG-Logos der LLM-Anbieter.
 * Die Logos sind stilisierte Darstellungen der Marken-Identität.
 * Keine externen Assets — alles als React-Komponenten.
 *
 * Marken-Logos werden hier im Nominativnutzung-Kontext verwendet
 * (Darstellung des jeweiligen Anbieters in der Anbieter-Auswahl).
 */

import React from 'react';

interface LogoProps {
  size?: number;
  color?: string;
}

// Anthropic: Stilisiertes "C" in der Anthropic-Fontart, warmes Tan
export function ClaudeLogo({ size = 24 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.388 3H6.612C5.17 3 4 4.17 4 5.612V18.388C4 19.83 5.17 21 6.612 21H17.388C18.83 21 20 19.83 20 18.388V5.612C20 4.17 18.83 3 17.388 3ZM10.92 8.712C10.176 8.712 9.576 9.312 9.576 10.056V13.944C9.576 14.688 10.176 15.288 10.92 15.288C11.664 15.288 12.264 14.688 12.264 13.944V10.056C12.264 9.312 11.664 8.712 10.92 8.712ZM16.008 8.712C15.264 8.712 14.664 9.312 14.664 10.056V13.944C14.664 14.688 15.264 15.288 16.008 15.288C16.752 15.288 17.352 14.688 17.352 13.944V10.056C17.352 9.312 16.752 8.712 16.008 8.712Z" fill="#D4A574" />
    </svg>
  );
}

// OpenAI: Stilisierte Hexagon-Ring-Form (Oktaeder-Knoten), grün
export function ChatGPTLogo({ size = 24 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.282 9.816a5.898 5.898 0 0 0-.515-4.91 6.038 6.038 0 0 0-5.824-2.88A5.878 5.878 0 0 0 3.52 6.518a5.898 5.898 0 0 0-3.893 2.88 6.038 6.038 0 0 0 .742 6.354 5.898 5.898 0 0 0 .515 4.91 6.038 6.038 0 0 0 5.824 2.88 5.878 5.878 0 0 0 8.923 2.258 5.898 5.898 0 0 0 3.893-2.88 5.898 5.898 0 0 0 2.647-4.276 6.038 6.038 0 0 0 .56-3.648Zm-9.328 12.76a4.466 4.466 0 0 1-2.976-1.134l.147-.08 4.618-2.668a.764.764 0 0 0 .386-.666V13.12l2.013 1.16a.07.07 0 0 1 .038.052v5.398a4.5 4.5 0 0 1-4.226 2.847ZM4.878 18.466a4.46 4.46 0 0 1-.534-2.998l.147.084 4.618 2.668a.748.748 0 0 0 .772 0l5.632-3.252v2.326a.075.075 0 0 1-.034.068l-4.67 2.7a4.498 4.498 0 0 1-5.931-1.576ZM2.907 10.16a4.498 4.498 0 0 1 2.36-1.97v5.4a.748.748 0 0 0 .384.666l5.604 3.234-2.013 1.16a.074.074 0 0 1-.07 0l-4.67-2.7A4.498 4.498 0 0 1 2.907 10.16Zm16.04 2.258l-5.604-3.234 2.013-1.162a.074.074 0 0 1 .07 0l4.67 2.7a4.498 4.498 0 0 1-.7 8.092V13.084a.764.764 0 0 0-.448-.666Zm2.394-3.584l-.147-.084-4.618-2.668a.748.748 0 0 0-.772 0L10.17 9.334V7.008a.067.067 0 0 1 .034-.068l4.67-2.7a4.5 4.5 0 0 1 6.47 5.194ZM9.328 13.608L7.314 12.45a.074.074 0 0 1-.034-.068V6.982a4.5 4.5 0 0 1 6.47-5.194l-.147.084-4.618 2.668a.748.748 0 0 0-.386.666l-.004 5.786a.084.084 0 0 1 0 .02Z" fill="#10A37F" />
    </svg>
  );
}

// DeepSeek: Blauer Walfisch-Schwung, Firmenfarbe #4D6BFE
export function DeepSeekLogo({ size = 24 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#4D6BFE" />
      <path d="M6 12C6 8.686 8.686 6 12 6C13.657 6 15.157 6.671 16.243 7.757L14.828 9.172C14.104 8.447 13.104 8 12 8C9.79 8 8 9.79 8 12s1.79 4 4 4c1.657 0 3.157-.671 4.243-1.757L17.657 15.657C16.157 17.157 14.157 18 12 18C8.686 18 6 15.314 6 12Z" fill="white" />
      <circle cx="17" cy="7" r="1.5" fill="white" />
    </svg>
  );
}

// Mistral: Stilisierte orangene Wind-/Welle-Form
export function MistralLogo({ size = 24 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#F70001" />
      <path d="M5 7h6v2H5V7Zm8 0h6v2h-6V7Zm-4 4h6v2H9v-2Zm-4 4h6v2H5v-2Zm8 0h6v2h-6v-2Z" fill="white" />
    </svg>
  );
}

// Qwen: Stilisiertes Q im Alibaba/DashScope-Lila
export function QwenLogo({ size = 24 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#6155B0" />
      <path d="M12 5C8.134 5 5 8.134 5 12s3.134 7 7 7c1.657 0 3.157-.671 4.243-1.757l-1.061-1.06A4.98 4.98 0 0 1 12 17c-2.761 0-5-2.239-5-5s2.239-5 5-5c1.38 0 2.63.561 3.536 1.464L16.597 7.4A6.97 6.97 0 0 0 12 5Z" fill="white" />
      <path d="M17 14l-2-2h4l-2 2Z" fill="white" />
    </svg>
  );
}

// Kimi/Moonshot: Stilisiertes K im Moonshot-Rot/Orange
export function KimiLogo({ size = 24 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#1A1A2E" />
      <path d="M9 6v12M9 12l6-6M9 12l3.5 3.5" stroke="#E94560" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const PROVIDER_LOGOS: Record<string, React.FC<LogoProps>> = {
  claude: ClaudeLogo,
  chatgpt: ChatGPTLogo,
  deepseek: DeepSeekLogo,
  mistral: MistralLogo,
  qwen: QwenLogo,
  kimi: KimiLogo,
};