import type { Part } from "./types.ts";

/**
 * Shown on first visit. Both hymns are in the public domain (Heber, 1826;
 * Newton, 1779). Keep sample and test lyrics public domain: never commit the
 * choir's documents, which are usually copyrighted songs.
 */
export const SAMPLE_SONGS: Part[] = [
  {
    title: "Holy, Holy, Holy",
    text: `Verse 1
Holy, holy, holy! Lord God Almighty! Early in the morning our song shall rise to Thee; Holy, holy, holy, merciful and mighty! God in three Persons, blessed Trinity!

Verse 2
Holy, holy, holy! All the saints adore Thee, Casting down their golden crowns around the glassy sea; Cherubim and seraphim falling down before Thee, Who wert, and art, and evermore shalt be.

Verse 3 (x2)
Holy, holy, holy! Lord God Almighty! All Thy works shall praise Thy Name, in earth, and sky, and sea; Holy, holy, holy, merciful and mighty! God in three Persons, blessed Trinity!`,
  },
  {
    title: "Amazing Grace",
    text: `Verse 1
Amazing grace! How sweet the sound That saved a wretch like me! I once was lost, but now am found; Was blind, but now I see.

Verse 2
'Twas grace that taught my heart to fear, And grace my fears relieved; How precious did that grace appear The hour I first believed.`,
  },
];
