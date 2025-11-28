export interface FreezeEmbeddingSettings {
	saveLocation: "same-directory" | "custom-directory";
	customDirectory: string;
	openFreezeFile: boolean;
}

export const DEFAULT_SETTINGS: FreezeEmbeddingSettings = {
	saveLocation: "same-directory",
	customDirectory: "",
	openFreezeFile: true,
};
