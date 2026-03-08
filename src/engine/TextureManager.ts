export class TextureManager {
    device: GPUDevice;
    textures: Map<string, GPUTexture> = new Map();
    samplers: Map<string, GPUSampler> = new Map();
    defaultSampler!: GPUSampler;

    constructor(device: GPUDevice) {
        this.device = device;
        this.defaultSampler = this.device.createSampler({
            magFilter: 'nearest', // 16-bit crisp scaling
            minFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        });
    }

    async loadTexture(id: string, url: string): Promise<GPUTexture> {
        if (this.textures.has(id)) {
            return this.textures.get(id)!;
        }

        // Catch missing fetch in Node environments (for tests)
        if (typeof fetch !== 'function') {
            console.warn(`[TextureManager] Skipping loadTexture('${id}') because fetch is undefined.`);
            const texture = this.device.createTexture({
                size: [1, 1, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this.textures.set(id, texture);
            return texture;
        }

        let response;
        try {
            response = await fetch(url);
        } catch (e) {
            console.warn(`[TextureManager] Failed to fetch '${url}'. Returning mock texture.`);
            const texture = this.device.createTexture({
                size: [1, 1, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this.textures.set(id, texture);
            return texture;
        }
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        const texture = this.device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture },
            [imageBitmap.width, imageBitmap.height]
        );

        this.textures.set(id, texture);
        return texture;
    }

    getTexture(id: string): GPUTexture | null {
        return this.textures.get(id) || null;
    }

    getSampler(): GPUSampler {
        return this.defaultSampler;
    }
}
