// The game's text, in the player's YouTube language where there is a
// translation, otherwise in English.

export interface Strings {
  language: (tag: string) => string;
  counter: (count: number) => string;
  press: string;
  interstitialAd: string;
  rewardedAd: string;
}

const en: Strings = {
  language: (tag) => `Language: ${tag}`,
  counter: (count) => `Counter: ${count}`,
  press: 'Press!',
  interstitialAd: 'Interstitial ad',
  rewardedAd: 'Rewarded ad: new color',
};

const fr: Strings = {
  language: (tag) => `Langue : ${tag}`,
  counter: (count) => `Compteur : ${count}`,
  press: 'Appuie !',
  interstitialAd: 'Pub interstitielle',
  rewardedAd: 'Pub avec récompense : nouvelle couleur',
};

const es: Strings = {
  language: (tag) => `Idioma: ${tag}`,
  counter: (count) => `Contador: ${count}`,
  press: '¡Pulsa!',
  interstitialAd: 'Anuncio intersticial',
  rewardedAd: 'Anuncio con premio: nuevo color',
};

const translations: Record<string, Strings> = { en, fr, es };

/** The strings for a BCP 47 language tag such as "fr-CA". */
export function stringsFor(tag: string): Strings {
  return translations[tag.toLowerCase().split('-')[0]] ?? en;
}
