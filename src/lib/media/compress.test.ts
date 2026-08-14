import { describe, expect, it, vi } from "vitest";

vi.mock("./compress.image", () => ({
	prepareImage: vi.fn(async (f: File) => ({ blob: f, name: f.name, converted: "webp" as const })),
}));
vi.mock("./compress.video", () => ({
	prepareVideo: vi.fn(async (f: File) => ({ blob: f, name: f.name, converted: "webm" as const })),
}));

import { prepareMedia } from "./compress";

describe("prepareMedia", () => {
	it("görsel dosyayı prepareImage'a yönlendirir", async () => {
		const file = new File([new Uint8Array(10)], "a.jpg", { type: "image/jpeg" });
		const out = await prepareMedia(file);
		expect(out.converted).toBe("webp");
	});

	it("video dosyayı prepareVideo'ya yönlendirir", async () => {
		const file = new File([new Uint8Array(10)], "a.mp4", { type: "video/mp4" });
		const out = await prepareMedia(file);
		expect(out.converted).toBe("webm");
	});

	it("desteklenmeyen türlerde dokunmadan geçer", async () => {
		const file = new File([new Uint8Array(10)], "a.pdf", { type: "application/pdf" });
		const out = await prepareMedia(file);
		expect(out.converted).toBe("none");
		expect(out.blob).toBe(file);
	});
});
