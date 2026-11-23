// The game's text, in the player's YouTube language when we have it.

export interface Strings {
  counter: (count: number) => string;
  press: string;
  interstitialAd: string;
  rewardedAd: string;
  language: (tag: string) => string;
}

const en: Strings = {
  counter: (count) => `Counter: ${count}`,
  press: "Press!",
  interstitialAd: "Interstitial ad",
  rewardedAd: "Rewarded ad: new colour",
  language: (tag) => `language: ${tag}`,
};

const fr: Strings = {
  counter: (count) => `Compteur : ${count}`,
  press: "Appuie !",
  interstitialAd: "Pub interstitielle",
  rewardedAd: "Pub : nouvelle couleur",
  language: (tag) => `langue : ${tag}`,
};

const es: Strings = {
  counter: (count) => `Contador: ${count}`,
  press: "¡Pulsa!",
  interstitialAd: "Anuncio intersticial",
  rewardedAd: "Anuncio: nuevo color",
  language: (tag) => `idioma: ${tag}`,
};

const translations: Record<string, Strings> = { en, fr, es };

/** The strings for a BCP-47 language tag such as "fr-CA", or English. */
export function stringsFor(language: string): Strings {
  const primary = language.toLowerCase().split("-")[0];
  return translations[primary] ?? en;
}
