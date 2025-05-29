export interface InfrastructurePattern {
	id: number;
	title: string;
	description: string;
	position: number;
	visibility: boolean;
	created_at: string;
	updated_at: string;
	wonder_infrastructure_patterns: any[];
	wonders: any[];
	infrastructure_pattern_dependencies: InfrastructurePatternDependency[];
}

export interface InfrastructurePatternDependency {
	id: number;
	dependable_type: 'Skill' | 'Wonder';
	dependable_id: number;
	usage: string;
	position: number;
	dependable: {
		id: number;
		title: string;
		[key: string]: any;
	};
}

export interface Wonder {
	id: number;
	title: string;
	[key: string]: any;
}
