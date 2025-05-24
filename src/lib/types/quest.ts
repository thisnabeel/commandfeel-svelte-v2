export interface Quest {
	id: number;
	title: string;
	// Add other quest properties as needed
}

export interface Language {
	id: number;
	title: string;
	slug: string;
}

export interface PopularQuest {
	quest: Quest;
	language: Language;
	language_slug: string;
	cover: string;
}
