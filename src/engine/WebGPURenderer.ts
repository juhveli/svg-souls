import { vertexShaderWGSL, fragmentShaderGBufferWGSL, fragmentShaderLightingWGSL, fragmentShaderPostProcessWGSL, vertexShaderFullscreenWGSL } from '../shaders/shaders';
import { TextureManager } from './TextureManager';
import { IsometricMath } from './IsometricMath';

export class WebGPURenderer {
    canvas: HTMLCanvasElement;
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipelines
    gBufferPipeline!: GPURenderPipeline;
    lightingPipeline!: GPURenderPipeline;

    // Buffers
    uniformBuffer!: GPUBuffer;
    lightingUniformBuffer!: GPUBuffer;

    // Textures (G-Buffer)
    albedoTexture!: GPUTexture;
    normalTexture!: GPUTexture;
    depthTexture!: GPUTexture;
    lightingTexture!: GPUTexture; // Output of Lighting Pass (Low Res)

    // Pipelines
    postProcessPipeline!: GPURenderPipeline;

    // Bind Groups
    gBufferBindGroup!: GPUBindGroup;
    lightingBindGroup!: GPUBindGroup;
    postProcessBindGroup!: GPUBindGroup;

    // Samplers
    nearestSampler!: GPUSampler;

    // Constants
    RETRO_SCALE = 4.0;
    MAX_INSTANCES = 1000; // Legacy constant, kept just in case
    // 10 floats * 4 bytes = 40 bytes.
    INSTANCE_SIZE = 10 * 4;

    // Rendering instance buffer
    private instanceBuffer!: GPUBuffer;
    private instanceCapacity: number = 0;
    private readonly INITIAL_INSTANCE_CAPACITY = 2048;

    // CPU-side Buffers (Optimization: Reuse to avoid GC)
    private uniformDataA!: Float32Array;
    private uniformDataB!: Float32Array;
    private lightingData!: Float32Array;

    private static instance: WebGPURenderer;

    // Texture Manager
    textureManager!: TextureManager;
    atlasBindGroup!: GPUBindGroup;

    // Resize Tracking
    private currentWidth: number = 0;
    private currentHeight: number = 0;

    constructor() {
        this.canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            // It might not exist yet if called too early, but usually init calls it.
        }

        // Initialize CPU-side buffers
        this.uniformDataA = new Float32Array(4); // Screen(2) + Camera(2)
        this.uniformDataB = new Float32Array(1); // Time(1)
        this.lightingData = new Float32Array(16); // Lighting Block
    }

    static getInstance(): WebGPURenderer {
        if (!WebGPURenderer.instance) {
            WebGPURenderer.instance = new WebGPURenderer();
        }
        return WebGPURenderer.instance;
    }

    async init(): Promise<void> {
        this.canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;

        if (!navigator.gpu) {
            console.error("WebGPU not supported.");
            return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.error("No WebGPU adapter found.");
            return;
        }
        this.adapter = adapter;

        this.device = await adapter.requestDevice();

        this.textureManager = new TextureManager(this.device);

        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        // Initialize size tracking
        this.currentWidth = this.canvas.width;
        this.currentHeight = this.canvas.height;

        await this.createResources();
        this.createPipelines();
        this.createBindGroups();

        // Load Atlas
        const atlasTex = await this.textureManager.loadTexture('sprite_atlas', '/assets/sprite_atlas.png');
        this.atlasBindGroup = this.device.createBindGroup({
            layout: this.gBufferPipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: atlasTex.createView() },
                { binding: 1, resource: this.textureManager.getSampler() }
            ]
        });

        console.log("WebGPU Renderer Initialized.");
    }

    destroyResources() {
        if (this.albedoTexture) this.albedoTexture.destroy();
        if (this.normalTexture) this.normalTexture.destroy();
        if (this.depthTexture) this.depthTexture.destroy();
        if (this.lightingTexture) this.lightingTexture.destroy();
        if (this.uniformBuffer) this.uniformBuffer.destroy();
        if (this.lightingUniformBuffer) this.lightingUniformBuffer.destroy();
        // Sampler is persistent/reusable usually, but let's leave it for now.
    }

    async createResources() {
        this.destroyResources();

        const width = Math.max(1, this.canvas.width);
        const height = Math.max(1, this.canvas.height);

        this.currentWidth = width;
        this.currentHeight = height;

        // Retro Crunch: Low Resolution Dimensions
        const lowResWidth = Math.max(1, Math.ceil(width / this.RETRO_SCALE));
        const lowResHeight = Math.max(1, Math.ceil(height / this.RETRO_SCALE));

        // 1. G-Buffer Textures (Low Res)
        this.albedoTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.normalTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.depthTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'r32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        // Lighting Result Texture (Low Res)
        this.lightingTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        // Sampler
        if (!this.nearestSampler) {
            this.nearestSampler = this.device.createSampler({
                magFilter: 'nearest',
                minFilter: 'nearest',
            });
        }

        // 2. Uniform Buffer
        // We need 2 blocks:
        // Block A (Vertex): Screen(2) + Camera(2) = 4 floats (16 bytes).
        // Block B (Frag): Time(1) = 1 float (4 bytes).
        // Minimal alignment for uniform buffer offset is usually 256 bytes!
        // So we must offset binding 1 by 256 bytes.

        this.uniformBuffer = this.device.createBuffer({
            size: 512, // Enough for 2 blocks aligned at 256
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 3. Lighting Uniform Buffer
        this.lightingUniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }

    createPipelines() {
        // --- G-BUFFER PIPELINE ---
        if (!this.gBufferPipeline) {
            const gBufferModule = this.device.createShaderModule({
                code: vertexShaderWGSL + "\n" + fragmentShaderGBufferWGSL
            });

            this.gBufferPipeline = this.device.createRenderPipeline({
                layout: 'auto', // Will infer group(1) from shader bindings
                vertex: {
                    module: gBufferModule,
                    entryPoint: 'main',
                    buffers: [{
                        arrayStride: this.INSTANCE_SIZE,
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x2' }, // center
                            { shaderLocation: 1, offset: 8, format: 'float32x2' }, // size
                            { shaderLocation: 2, offset: 16, format: 'float32x2' }, // uvOffset (u0, v0)
                            { shaderLocation: 3, offset: 24, format: 'float32x2' }, // uvScale (dw, dh)
                            { shaderLocation: 4, offset: 32, format: 'float32' },   // rotation
                            { shaderLocation: 5, offset: 36, format: 'float32' }    // alpha
                        ]
                    }]
                },
                fragment: {
                    module: gBufferModule,
                    entryPoint: 'main',
                    targets: [
                        { format: 'bgra8unorm' }, // Albedo
                        { format: 'rgba8unorm' }, // Normal
                        { format: 'r32float' }    // Depth
                    ]
                },
                primitive: { topology: 'triangle-list' }
            });
        }

        // --- LIGHTING PIPELINE ---
        if (!this.lightingPipeline) {
            const lightingModule = this.device.createShaderModule({ code: fragmentShaderLightingWGSL });

            this.lightingPipeline = this.device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: this.device.createShaderModule({
                        code: `
                        @vertex fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
                            var pos = array<vec2<f32>, 6>(
                                vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
                                vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
                            );
                            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                        }`
                    }),
                    entryPoint: 'main',
                },
                fragment: {
                    module: lightingModule,
                    entryPoint: 'main',
                    targets: [{ format: this.format }]
                }
            });
        }

        // --- POST PROCESS PIPELINE ---
        if (!this.postProcessPipeline) {
            const postProcessModule = this.device.createShaderModule({ code: fragmentShaderPostProcessWGSL });
            const fsVertexModule = this.device.createShaderModule({ code: vertexShaderFullscreenWGSL });

            this.postProcessPipeline = this.device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: fsVertexModule,
                    entryPoint: 'main'
                },
                fragment: {
                    module: postProcessModule,
                    entryPoint: 'main',
                    targets: [{ format: this.format }] // Output to Screen
                },
                primitive: { topology: 'triangle-list' }
            });
        }
    }

    createBindGroups() {
        this.gBufferBindGroup = this.device.createBindGroup({
            layout: this.gBufferPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer, offset: 0, size: 16 } }
            ]
        });

        this.lightingBindGroup = this.device.createBindGroup({
            layout: this.lightingPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.lightingUniformBuffer } },
                { binding: 1, resource: this.albedoTexture.createView() },
                { binding: 2, resource: this.normalTexture.createView() },
                { binding: 3, resource: this.depthTexture.createView() },
                { binding: 4, resource: this.nearestSampler }
            ]
        });

        this.postProcessBindGroup = this.device.createBindGroup({
            layout: this.postProcessPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.lightingTexture.createView() },
                { binding: 1, resource: this.nearestSampler }
            ]
        });
    }

    resize(width: number, height: number) {
        if (width === this.currentWidth && height === this.currentHeight) return;

        // Ensure canvas matches
        this.canvas.width = width;
        this.canvas.height = height;

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        // Recreate resources and bind groups
        this.createResources();
        this.createBindGroups();
    }

    // TODO: Implement "glitch" post-process effect (chromatic aberration/shift) when near World 5 anomalies.
    // TODO: Implement Chladni Shaders (Cymatics) for ground impacts - map ground texture to react to heavy impacts (Metronome Sentry) with geometric standing wave patterns

    render(map: any, entities: any[], camera: any, playerRef?: any) {
        if (!this.device || !this.context) return;

        // Check for resize
        if (this.canvas.width !== this.currentWidth || this.canvas.height !== this.currentHeight) {
            this.resize(this.canvas.width, this.canvas.height);
        }

        const time = performance.now() / 1000;

        // 1. Update Global Uniforms
        // Convert the Cartesian camera position to Isometric screen coordinates
        // because all entities are projected to Isometric screen coordinates before being passed to the shader.
        // We also want to shift the camera so 0,0 is at the center of the screen, or at least respect the original camera offset.
        // The camera object in Game typically tracks the center of the viewport in Cartesian space implicitly,
        // actually `camera.x/y` is usually top-left. Let's project the center of the camera.
        const isoCameraCenter = IsometricMath.worldToScreen(camera.x + camera.width / 2, camera.y + camera.height / 2, 0);

        // Adjust back to top-left of the ISOMETRIC screen view for the shader
        const isoCameraUniform = {
            x: isoCameraCenter.x - this.canvas.width / 2,
            y: isoCameraCenter.y - this.canvas.height / 2
        };

        // Block A: Screen(2), Camera(2)
        this.uniformDataA[0] = this.canvas.width;
        this.uniformDataA[1] = this.canvas.height;
        this.uniformDataA[2] = isoCameraUniform.x;
        this.uniformDataA[3] = isoCameraUniform.y;
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformDataA);

        // Block B: Time(1) at offset 256
        this.uniformDataB[0] = time;
        this.device.queue.writeBuffer(this.uniformBuffer, 256, this.uniformDataB);

        // 2. Update Lighting Uniforms
        // Layout: Screen(2), Camera(2), LightPos(2), Padding(2), LightColor(3+1), Ambient(3+1)

        let playerX = 0, playerY = 0;
        const player = playerRef || entities.find(e => e.constructor.name === 'Player');
        if (player) {
            const isoPlayer = IsometricMath.worldToScreen(player.x, player.y, (player as any).z || 0);
            playerX = isoPlayer.x;
            playerY = isoPlayer.y;
        }

        this.lightingData[0] = this.canvas.width;
        this.lightingData[1] = this.canvas.height;
        this.lightingData[2] = isoCameraUniform.x;
        this.lightingData[3] = isoCameraUniform.y;
        this.lightingData[4] = playerX;
        this.lightingData[5] = playerY;
        this.lightingData[6] = 0;
        this.lightingData[7] = 0;
        this.lightingData[8] = 1.0;
        this.lightingData[9] = 0.7;
        this.lightingData[10] = 0.4;
        this.lightingData[11] = 0.0;
        this.lightingData[12] = 0.1;
        this.lightingData[13] = 0.15;
        this.lightingData[14] = 0.25;
        this.lightingData[15] = 0.0;
        this.device.queue.writeBuffer(this.lightingUniformBuffer, 0, this.lightingData);

        // 3. Single Instance Buffer Sorting & Culling
        // Culling Bounds (Camera + Padding)
        // We evaluate against the isometric camera's top-left corner
        const pad = 300;
        const camLeft = isoCameraUniform.x - pad;
        const camTop = isoCameraUniform.y - pad;
        const camRight = isoCameraUniform.x + this.canvas.width + pad;
        const camBottom = isoCameraUniform.y + this.canvas.height + pad;

        // Build a render list combining map tiles and entities
        const renderList: any[] = [];

        if (map && map.tiles) {
            for (const t of map.tiles) {
                renderList.push({
                    isTile: true,
                    x: t.x,
                    y: t.y,
                    z: t.z || 0,
                    width: IsometricMath.TILE_WIDTH,
                    height: IsometricMath.TILE_WIDTH, // use square for projection logic
                    textureId: t.textureId || 'floor_tile_placeholder'
                });
            }
        }

        for (const e of entities) {
            renderList.push(e);
        }

        // Sort render list based on isometric depth
        // We draw back to front. Larger depth means further away (or lower), so draw it first.
        // Let's verify Isometric depth: smaller Y means higher on screen. But sorting order should be smallest depth first if depth is Z-index.
        // Typically, sort by depth ascending.
        renderList.sort((a, b) => {
            const depthA = IsometricMath.calculateDepth(a.x || 0, a.y || 0, a.z || 0);
            const depthB = IsometricMath.calculateDepth(b.x || 0, b.y || 0, b.z || 0);
            return depthA - depthB;
        });

        // Prepare CPU buffer for instances
        if (renderList.length > this.instanceCapacity) {
            this.instanceCapacity = Math.max(this.INITIAL_INSTANCE_CAPACITY, renderList.length * 2);
            if (this.instanceBuffer) {
                this.instanceBuffer.destroy();
            }
            this.instanceBuffer = this.device.createBuffer({
                size: this.instanceCapacity * this.INSTANCE_SIZE,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });
        }

        const cpuData = new Float32Array(renderList.length * 10);
        let instanceCount = 0;

        // Player coordinates for alpha fading check
        let pWorldX = player?.x || 0;
        let pWorldY = player?.y || 0;
        let pScreenX = playerX;
        let pScreenY = playerY;

        for (const e of renderList) {
            // Apply isometric projection
            const isoPos = IsometricMath.worldToScreen(e.x || 0, e.y || 0, e.z || 0);
            const screenX = isoPos.x;
            const screenY = isoPos.y;

            // For tiles, visual size is the tile size (64x32)
            // For entities, use their width/height but remember it's 2D space visually now
            const w = e.isTile ? IsometricMath.TILE_WIDTH : (e.width || 64);
            const h = e.isTile ? IsometricMath.TILE_HEIGHT : (e.height || 64);

            // Check if entity is within camera bounds + padding
            if (screenX + w/2 < camLeft || screenX - w/2 > camRight ||
                screenY + h/2 < camTop || screenY - h/2 > camBottom) {
                 continue; // Not visible
            }

            // Texture Data Extraction
            let u0 = 0.0, v0 = 0.0, uScale = 1.0, vScale = 1.0;
            let rot = e.rotation || 0;

            if (e.textureId) {
                const game = (window as any).Game?.getInstance();
                if (game && game.atlasData && game.atlasData[e.textureId]) {
                    const data = game.atlasData[e.textureId];
                    u0 = data.u0;
                    v0 = data.v0;
                    uScale = data.u1 - data.u0;
                    vScale = data.v1 - data.v0;
                } else if (e.uvOffset && e.uvScale) {
                    u0 = e.uvOffset[0];
                    v0 = e.uvOffset[1];
                    uScale = e.uvScale[0];
                    vScale = e.uvScale[1];
                }
            }

            let alpha = 1.0;

            // Alpha fading for tall objects blocking the player
            if (!e.isTile && e !== player && player) {
                // If the entity is tall (high z or physically tall) and has a lower base sort depth
                const eBaseDepth = (e.x || 0) + (e.y || 0);
                const pBaseDepth = pWorldX + pWorldY;

                // If player is behind the entity (larger base depth)
                if (eBaseDepth > pBaseDepth) {
                     // Check screen-space bounding box overlap roughly
                     // If player screen pos is within the visual bounding box of this entity
                     if (pScreenX > screenX - w/2 && pScreenX < screenX + w/2 &&
                         pScreenY > screenY - h/2 && pScreenY < screenY + h/2) {
                         alpha = 0.5; // Transparent
                     }
                }
            }

            const offset = instanceCount * 10;
            // Write screen position to buffer
            cpuData[offset + 0] = screenX;
            cpuData[offset + 1] = screenY;
            cpuData[offset + 2] = w;
            cpuData[offset + 3] = h;
            cpuData[offset + 4] = u0;
            cpuData[offset + 5] = v0;
            cpuData[offset + 6] = uScale;
            cpuData[offset + 7] = vScale;
            cpuData[offset + 8] = rot;
            cpuData[offset + 9] = alpha;

            instanceCount++;
        }

        // 4. Render Passes
        const commandEncoder = this.device.createCommandEncoder();

        // Pass 1: G-Buffer
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.albedoTexture.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.normalTexture.createView(),
                    clearValue: { r: 0.5, g: 0.5, b: 1.0, a: 1.0 }, // Flat normal Z+
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.depthTexture.createView(),
                    clearValue: { r: 0.0, g: 0, b: 0, a: 1.0 }, // Depth init
                    loadOp: 'clear',
                    storeOp: 'store'
                }
            ]
        });

        passEncoder.setPipeline(this.gBufferPipeline);
        passEncoder.setBindGroup(0, this.gBufferBindGroup);
        if (this.atlasBindGroup) {
            passEncoder.setBindGroup(1, this.atlasBindGroup);
        }

        if (instanceCount > 0 && this.instanceBuffer) {
             // Write Buffer
             this.device.queue.writeBuffer(this.instanceBuffer, 0, cpuData, 0, instanceCount * 10);

             // Draw
             passEncoder.setVertexBuffer(0, this.instanceBuffer);
             passEncoder.draw(6, instanceCount, 0, 0);
        }

        passEncoder.end();

        // Pass 2: Lighting
        const lightingPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.lightingTexture.createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        lightingPass.setPipeline(this.lightingPipeline);
        lightingPass.setBindGroup(0, this.lightingBindGroup);
        lightingPass.draw(6, 1, 0, 0); // Fullscreen
        lightingPass.end();

        // Pass 3: Post-Process (Upscale + Retro Crunch)
        const postProcessPass = commandEncoder.beginRenderPass({
             colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        postProcessPass.setPipeline(this.postProcessPipeline);
        postProcessPass.setBindGroup(0, this.postProcessBindGroup);
        postProcessPass.draw(6, 1, 0, 0);
        postProcessPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

}
