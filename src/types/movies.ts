export enum MovieType {
  Drama,
  SuperHeroes,
  Comedy,
  Action,
  Romance,
  Thriller,
  Horror,
  SciFi,
  Fantasy,
  Adventure,
  Historical,
  Mystery,
  Animation,
  Family,
  Musical,
  Western,
  Documentary,
  War,
  Crime,
  Biographical,
}

export enum COUNTRY_NAME {
  Myanmar,
  English,
  China,
  Korea,
  Japan,
  India,
  France,
  Germany,
  Italy,
  Russia,
  Spain,
  Mexico,
  Brazil,
  Canada,
  Australia,
  NewZealand,
  SouthAfrica,
  Nigeria,
  Egypt,
}

export interface MovieDetail {
  country_name: COUNTRY_NAME;
  type: MovieType[]; // Now it accepts an array of MovieType
  detail: string;
  actor: string[];
}

export interface Movie {
  movieId: string;
  name: string;
  image: string;
  description: string;
  uploaderId: string;
  details: MovieDetail;
  releasedate: number;
  created: number;
  updated: number;
}
