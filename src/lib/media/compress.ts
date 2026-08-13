// Client-side medya sıkıştırma (görsel→WebP, video→WebM) — WP1 dolduracak.
// Faz 0 stub: dosyayı dokunmadan geçirir, akışı bozmaz.
export type PreparedMedia = {
	blob: Blob
	name: string
	converted: 'webp' | 'jpeg' | 'webm' | 'mp4' | 'none'
}

export async function prepareMedia(file: File): Promise<PreparedMedia> {
	return { blob: file, name: file.name, converted: 'none' }
}
