export const organizations = [
  {
    slug: 'encore-performing-arts',
    name: 'Encore Performing Arts',
    shortName: 'Encore',
    category: 'theater',
    website: 'https://encorepa.org/',
    tagline: 'Inspiring discovery and imagination through exploration and play.',
    description:
      'A Southern Utah 501(c)(3) nonprofit dedicated to youth musical theater. Encore produces full-scale musical productions starring young performers ages 7–18, alongside classes in singing, dance, and acting, and the Aspire Performing Co. show choir program.',
    longDescription:
      'Founded as a home for young artists in Southern Utah, Encore Performing Arts has grown into a year-round program of classes, ensembles, and full productions. Summer mainstage musicals draw casts of dozens of young performers from across Washington County; the Aspire Performing Co. show choir performs at events throughout the region; and the Page to Stage program brings school groups into the theater for an interactive introduction to live performance. Encore has been a resident company of the Electric Theater since approximately 2018.',
  },
  {
    slug: 'stage-door',
    name: 'Stage Door',
    shortName: 'Stage Door',
    category: 'theater',
    website: 'https://www.stagedoorutah.com/',
    tagline: 'Award-winning Southern Utah community theater.',
    description:
      'An award-winning community theater company producing musicals and dramatic plays for adult audiences. Recent seasons have included Next to Normal, Come from Away, The Cottage, and Dear Evan Hansen, with auditions open to community members.',
    longDescription:
      'Stage Door produces a full season of theater each year at the Electric Theater, ranging from contemporary Broadway musicals to challenging dramatic works. Casts are drawn entirely from the Southern Utah community, and the company has earned regional recognition for its production values and its willingness to take on demanding material. Auditions are open to the public for every production.',
  },
  {
    slug: 'st-george-dance-company',
    name: 'St. George Dance Company',
    shortName: 'SGDC',
    category: 'dance',
    website: 'https://www.stgeorgedance.com/',
    tagline:
      'Keeping our local art and cultural scene thriving — and Southern Utah a fabulous place to live.',
    description:
      'A dance organization presenting concerts, festivals, and community classes across a range of contemporary, modern, and classical styles. SGDC hosts the annual Red Rock Dance Festival and produces seasonal performances at the Electric Theater.',
    longDescription:
      'St. George Dance Company anchors the dance community in Southern Utah. The company presents seasonal concerts at the Electric Theater that showcase original choreography from resident and guest artists, and each summer it hosts the Red Rock Dance Festival, a weekend of workshops, adjudicated student choreography, and main stage performances. Community classes are offered year-round.',
  },
  {
    slug: 'fmasu',
    name: 'Film and Media Alliance of Southern Utah',
    shortName: 'FMASU',
    category: 'film',
    website: 'https://www.fmasu.com/',
    tagline:
      'Nurturing, celebrating, and inspiring filmmakers through engaging programs and an unwavering dedication to the art of cinema.',
    description:
      'A 501(c)(3) nonprofit serving the Southern Utah film community. FMASU produces the Desertscape International Film Festival, HorrorFest International, the free monthly Electric Film Series, the Guerilla Filmmaking Challenge, and the FMASU Academy.',
    longDescription:
      'FMASU exists to build a year-round home for filmmakers and film lovers in Southern Utah. Its flagship Desertscape International Film Festival brings independent features and shorts to the Electric Theater each year, alongside the genre-focused HorrorFest International. The free monthly Electric Film Series puts great films back on the big screen, and the Guerilla Filmmaking Challenge and FMASU Academy give emerging filmmakers a chance to create, learn, and connect.',
  },
];

export function getOrganizationBySlug(slug) {
  return organizations.find((org) => org.slug === slug);
}
